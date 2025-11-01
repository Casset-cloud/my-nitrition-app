# -*- coding: utf-8 -*-
"""
Главное Flask приложение для дневника питания
Автор: Ваш проект
Дата: 2025-11-01
"""

from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from datetime import datetime, timedelta
import os

# Импортируем наши модули
from database import Database
from auth import AuthManager
from reports import ReportGenerator

# Инициализация Flask приложения
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # Разрешаем кросс-доменные запросы

# Инициализация компонентов
db = Database()
auth_manager = AuthManager(db)
report_generator = ReportGenerator(db)


# ==================== МАРШРУТЫ ДЛЯ СТАТИЧЕСКИХ ФАЙЛОВ ====================

@app.route('/')
def index():
    """Главная страница приложения"""
    return send_from_directory('static', 'index.html')


@app.route('/login')
def login_page():
    """Страница входа"""
    return send_from_directory('static', 'login.html')


# ==================== API АВТОРИЗАЦИИ ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Вход пользователя или создание нового пользователя
    Принимает: {"username": "имя_пользователя"}
    Возвращает: {"success": true, "user_id": 1, "is_new": false, "current_stage": {...}}
    """
    try:
        data = request.get_json()
        username = data.get('username', '').strip()

        if not username:
            return jsonify({"success": False, "error": "Имя пользователя не может быть пустым"}), 400

        # Проверяем существует ли пользователь
        user = auth_manager.login_user(username)

        return jsonify({
            "success": True,
            "user_id": user['id'],
            "username": user['username'],
            "is_new": user['is_new'],
            "current_stage": user['current_stage']
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/auth/check', methods=['POST'])
def check_auth():
    """
    Проверка авторизации пользователя
    Принимает: {"user_id": 1}
    Возвращает: {"success": true, "username": "имя", "current_stage": {...}}
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({"success": False, "error": "Не указан user_id"}), 400

        user = auth_manager.get_user_by_id(user_id)

        if not user:
            return jsonify({"success": False, "error": "Пользователь не найден"}), 404

        return jsonify({
            "success": True,
            "username": user['username'],
            "current_stage": user['current_stage']
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== API ЭТАПОВ ПРОГРАММЫ ====================

@app.route('/api/stage/create', methods=['POST'])
def create_stage():
    """
    Создание нового этапа программы
    Принимает: {
        "user_id": 1,
        "stage_type": "Обучение",
        "start_date": "2025-11-01",
        "initial_weight": 85.5
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        stage_type = data.get('stage_type')
        start_date = data.get('start_date')
        initial_weight = data.get('initial_weight')

        # Проверка обязательных полей
        if not all([user_id, stage_type, start_date, initial_weight]):
            return jsonify({"success": False, "error": "Не все обязательные поля заполнены"}), 400

        # Проверяем, нет ли активного этапа
        active_stage = db.get_active_stage(user_id)
        if active_stage:
            return jsonify({
                "success": False, 
                "error": "У вас уже есть активный этап. Завершите его перед созданием нового."
            }), 400

        # Создаем новый этап
        stage_id = db.create_stage(user_id, stage_type, start_date, initial_weight)

        return jsonify({
            "success": True,
            "stage_id": stage_id,
            "message": "Этап программы успешно создан"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/stage/complete', methods=['POST'])
def complete_stage():
    """
    Завершение текущего этапа программы
    Принимает: {"user_id": 1, "stage_id": 1}
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        stage_id = data.get('stage_id')

        if not all([user_id, stage_id]):
            return jsonify({"success": False, "error": "Не указаны обязательные параметры"}), 400

        db.complete_stage(stage_id)

        return jsonify({
            "success": True,
            "message": "Этап программы успешно завершен"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/stage/current/<int:user_id>', methods=['GET'])
def get_current_stage(user_id):
    """
    Получение информации о текущем активном этапе
    """
    try:
        stage = db.get_active_stage(user_id)

        if not stage:
            return jsonify({"success": True, "stage": None})

        return jsonify({"success": True, "stage": stage})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== API ЕЖЕДНЕВНЫХ ЗАПИСЕЙ ====================

@app.route('/api/entry/save', methods=['POST'])
def save_entry():
    """
    Сохранение ежедневной записи
    Принимает: {
        "user_id": 1,
        "stage_id": 1,
        "entry_date": "2025-11-01",
        "daily_params": {...},
        "meals": [...]
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        stage_id = data.get('stage_id')
        entry_date = data.get('entry_date')
        daily_params = data.get('daily_params', {})
        meals = data.get('meals', [])

        if not all([user_id, stage_id, entry_date]):
            return jsonify({"success": False, "error": "Не указаны обязательные параметры"}), 400

        # Сохраняем запись
        entry_id = db.save_daily_entry(user_id, stage_id, entry_date, daily_params, meals)

        return jsonify({
            "success": True,
            "entry_id": entry_id,
            "message": "Запись успешно сохранена"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/entry/get', methods=['GET'])
def get_entry():
    """
    Получение записи за определенную дату
    Параметры: user_id, date
    """
    try:
        user_id = request.args.get('user_id')
        entry_date = request.args.get('date')

        if not all([user_id, entry_date]):
            return jsonify({"success": False, "error": "Не указаны обязательные параметры"}), 400

        entry = db.get_entry_by_date(user_id, entry_date)

        return jsonify({"success": True, "entry": entry})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/entry/history/<int:user_id>', methods=['GET'])
def get_entry_history(user_id):
    """
    Получение истории записей пользователя
    Параметры: limit (опционально)
    """
    try:
        limit = request.args.get('limit', 30, type=int)

        entries = db.get_user_entries(user_id, limit)

        return jsonify({"success": True, "entries": entries})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== API ПРОДУКТОВ ====================

@app.route('/api/products/add', methods=['POST'])
def add_product():
    """
    Добавление продукта в базу данных пользователя
    Принимает: {
        "user_id": 1,
        "product_name": "Курица грудка",
        "calories_per_100g": 110
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        product_name = data.get('product_name', '').strip()
        calories_per_100g = data.get('calories_per_100g')

        if not all([user_id, product_name, calories_per_100g]):
            return jsonify({"success": False, "error": "Не все обязательные поля заполнены"}), 400

        product_id = db.add_product(user_id, product_name, calories_per_100g)

        return jsonify({
            "success": True,
            "product_id": product_id,
            "message": "Продукт добавлен в базу данных"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/products/search/<int:user_id>', methods=['GET'])
def search_products(user_id):
    """
    Поиск продуктов в базе данных пользователя
    Параметры: query (поисковый запрос)
    """
    try:
        query = request.args.get('query', '')

        products = db.search_products(user_id, query)

        return jsonify({"success": True, "products": products})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/products/list/<int:user_id>', methods=['GET'])
def list_products(user_id):
    """
    Получение всех продуктов пользователя
    """
    try:
        products = db.get_user_products(user_id)

        return jsonify({"success": True, "products": products})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== API ОТЧЕТОВ ====================

@app.route('/api/report/generate', methods=['POST'])
def generate_report():
    """
    Генерация отчета за определенную дату
    Принимает: {
        "user_id": 1,
        "date": "2025-11-01",
        "format": "html"  // html, pdf, excel
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        report_date = data.get('date')
        report_format = data.get('format', 'html')

        if not all([user_id, report_date]):
            return jsonify({"success": False, "error": "Не указаны обязательные параметры"}), 400

        # Генерируем отчет
        report_file = report_generator.generate_report(user_id, report_date, report_format)

        return jsonify({
            "success": True,
            "report_url": f"/reports/{report_file}",
            "message": "Отчет успешно сгенерирован"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/reports/<filename>')
def serve_report(filename):
    """Отдача сгенерированных отчетов"""
    return send_from_directory('reports', filename)


# ==================== API СТАТИСТИКИ ====================

@app.route('/api/stats/weight/<int:user_id>', methods=['GET'])
def get_weight_stats(user_id):
    """
    Получение статистики по весу
    Параметры: days (количество дней, по умолчанию 30)
    """
    try:
        days = request.args.get('days', 30, type=int)

        stats = db.get_weight_statistics(user_id, days)

        return jsonify({"success": True, "stats": stats})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==================== ЗАПУСК ПРИЛОЖЕНИЯ ====================

if __name__ == '__main__':
    # Создаем необходимые директории
    os.makedirs('reports', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    os.makedirs('templates', exist_ok=True)

    # Инициализация базы данных
    db.init_database()

    # Запуск сервера
    print("🚀 Сервер запущен на http://localhost:5000")
    print("📝 Дневник питания готов к работе!")
    app.run(debug=True, host='0.0.0.0', port=5000)
