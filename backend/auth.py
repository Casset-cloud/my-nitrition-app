
# -*- coding: utf-8 -*-
"""
Модуль авторизации через логин без пароля
"""

class AuthManager:
    def __init__(self, db):
        self.db = db

    def login_user(self, username):
        # Даем возможность зайти под любым новым логином
        user = self.db.login_user(username)
        return user

    def get_user_by_id(self, user_id):
        user = self.db.get_user_by_id(user_id)
        return user
