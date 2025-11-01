
# -*- coding: utf-8 -*-
"""
Модуль для взаимодействия с SQLite базой данных
"""

import sqlite3
from datetime import datetime
import json

class Database:
    def __init__(self, db_path='db.sqlite3'):
        self.db_path = db_path

    def get_conn(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def init_database(self):
        conn = self.get_conn()
        c = conn.cursor()
        # Создание таблиц
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stage_type TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            initial_weight REAL NOT NULL,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stage_id INTEGER NOT NULL,
            entry_date DATE NOT NULL,
            daily_params TEXT,
            meals TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (stage_id) REFERENCES stages(id)
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            calories_per_100g REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        ''')
        conn.commit()
        conn.close()

    def login_user(self, username):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT id, username FROM users WHERE username=?', (username,))
        user = c.fetchone()
        if user:
            # Проверяем активный этап программы
            c.execute('SELECT * FROM stages WHERE user_id=? AND completed=0', (user['id'],))
            stage = c.fetchone()
            current_stage = dict(stage) if stage else None
            conn.close()
            return { 'id': user['id'], 'username': user['username'], 'is_new': False, 'current_stage': current_stage }
        else:
            # Создаем нового пользователя
            c.execute('INSERT INTO users (username) VALUES (?)', (username,))
            conn.commit()
            user_id = c.lastrowid
            conn.close()
            return { 'id': user_id, 'username': username, 'is_new': True, 'current_stage': None }

    def get_user_by_id(self, user_id):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT id, username FROM users WHERE id=?', (user_id,))
        user = c.fetchone()
        if not user:
            conn.close()
            return None
        # Проверяем активный этап
        c.execute('SELECT * FROM stages WHERE user_id=? AND completed=0', (user_id,))
        stage = c.fetchone()
        current_stage = dict(stage) if stage else None
        conn.close()
        return { 'id': user['id'], 'username': user['username'], 'current_stage': current_stage }

    def create_stage(self, user_id, stage_type, start_date, initial_weight):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('''INSERT INTO stages (user_id, stage_type, start_date, initial_weight, completed) VALUES (?, ?, ?, ?, 0)''',
                  (user_id, stage_type, start_date, initial_weight))
        conn.commit()
        stage_id = c.lastrowid
        conn.close()
        return stage_id

    def complete_stage(self, stage_id):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('UPDATE stages SET completed=1, end_date=? WHERE id=?', (datetime.now().date(), stage_id))
        conn.commit()
        conn.close()

    def get_active_stage(self, user_id):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT * FROM stages WHERE user_id=? AND completed=0', (user_id,))
        stage = c.fetchone()
        conn.close()
        return dict(stage) if stage else None

    def save_daily_entry(self, user_id, stage_id, entry_date, daily_params, meals):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('INSERT INTO entries (user_id, stage_id, entry_date, daily_params, meals) VALUES (?, ?, ?, ?, ?)',
                  (user_id, stage_id, entry_date, json.dumps(daily_params, ensure_ascii=False), json.dumps(meals, ensure_ascii=False)))
        conn.commit()
        entry_id = c.lastrowid
        conn.close()
        return entry_id

    def get_entry_by_date(self, user_id, entry_date):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT * FROM entries WHERE user_id=? AND entry_date=?', (user_id, entry_date))
        entry = c.fetchone()
        conn.close()
        return dict(entry) if entry else None

    def get_user_entries(self, user_id, limit=30):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT * FROM entries WHERE user_id=? ORDER BY entry_date DESC LIMIT ?', (user_id, limit))
        entries = c.fetchall()
        conn.close()
        return [dict(entry) for entry in entries]

    def add_product(self, user_id, product_name, calories_per_100g):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('INSERT INTO products (user_id, product_name, calories_per_100g) VALUES (?, ?, ?)',
                  (user_id, product_name, calories_per_100g))
        conn.commit()
        product_id = c.lastrowid
        conn.close()
        return product_id

    def get_user_products(self, user_id):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT * FROM products WHERE user_id=?', (user_id,))
        products = c.fetchall()
        conn.close()
        return [dict(prod) for prod in products]

    def search_products(self, user_id, query):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT * FROM products WHERE user_id=? AND product_name LIKE ?', (user_id, f'%{query}%'))
        products = c.fetchall()
        conn.close()
        return [dict(prod) for prod in products]

    def get_weight_statistics(self, user_id, days=30):
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT entry_date, daily_params FROM entries WHERE user_id=? ORDER BY entry_date DESC LIMIT ?', (user_id, days))
        rows = c.fetchall()
        stats = []
        for row in rows:
            try:
                params = json.loads(row['daily_params'])
            except:
                params = {}
            stat = {
                'date': row['entry_date'],
                'weight': params.get('morning_weight'),
                'next_weight': params.get('next_morning_weight'),
                'lost_weight': params.get('weight_lost'),
            }
            stats.append(stat)
        conn.close()
        return stats
