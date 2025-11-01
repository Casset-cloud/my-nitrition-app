
# -*- coding: utf-8 -*-
"""
Модуль генерации отчетов (HTML, PDF, Excel)
"""
import os
import json
from datetime import datetime
from jinja2 import Template

class ReportGenerator:
    def __init__(self, db, reports_dir='reports'):
        self.db = db
        self.reports_dir = reports_dir

    def generate_report(self, user_id, report_date, report_format='html'):
        # Получаем данные из базы
        entry = self.db.get_entry_by_date(user_id, report_date)
        if not entry:
            raise Exception("Нет записи на эту дату")
        daily_params = json.loads(entry['daily_params']) if entry['daily_params'] else {}
        meals = json.loads(entry['meals']) if entry['meals'] else []
        # Формируем HTML с помощью шаблона (пример)
        html_template = '''
        <html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:850px;padding:24px;background:#fff;">
        <h2 style="text-align:center">Ежедневный отчет за {{date}}</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td><b>Этап:</b> {{stage}}</td><td><b>День:</b> {{day}}</td><td><b>Дата:</b> {{date}}</td></tr>
        <tr><td><b>Вес утром:</b> {{weight}}</td><td><b>След. вес:</b> {{next_weight}}</td><td><b>Сброшено:</b> {{lost_weight}}</td></tr>
        <tr><td colspan='3'><b>Талии:</b> {{waist}}, <b>Бедра:</b> {{hips}}</td></tr>
        <tr><td colspan='3'><b>Калорий/Плотность:</b> {{total_grams}} г / {{total_kcal}} ккал / {{kcal_density}} </td></tr>
        </table>
        <h3>Приемы пищи</h3>
        <table border='1' style="width:100%;border-collapse:collapse">
        <tr><th>Время</th><th>Что съедено</th><th>Масса</th><th>Ккал</th></tr>
        {% for meal in meals %}
          <tr><td>{{meal.get('time','')}}</td><td>{{meal.get('food','')}}</td><td>{{meal.get('mass','')}}</td><td>{{meal.get('kcal','')}}</td></tr>
        {% endfor %}
        </table>
        <p style="margin-top:48px"><b>Отеки:</b> {{edema}}<br><b>День цикла:</b> {{cycle}}<br><b>Стул:</b> {{stool}}</p>
        </body></html>
        '''
        template_data = {
            'stage': daily_params.get('stage_type',''),
            'day': daily_params.get('program_day',''),
            'date': report_date,
            'weight': daily_params.get('morning_weight',''),
            'next_weight': daily_params.get('next_morning_weight',''),
            'lost_weight': daily_params.get('weight_lost',''),
            'waist': daily_params.get('waist',''),
            'hips': daily_params.get('hips',''),
            'total_grams': daily_params.get('total_grams',''),
            'total_kcal': daily_params.get('total_kcal',''),
            'kcal_density': daily_params.get('kcal_density',''),
            'edema': daily_params.get('edema',''),
            'cycle': daily_params.get('cycle_day',''),
            'stool': daily_params.get('stool',''),
            'meals': meals
        }
        html = Template(html_template).render(**template_data)
        filename = f"report_{user_id}_{report_date}.{report_format}"
        filepath = os.path.join(self.reports_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)
        return filename
