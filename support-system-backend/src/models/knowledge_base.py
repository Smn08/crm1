from src.extensions import db
from datetime import datetime

class KnowledgeBaseArticle(db.Model):
    __tablename__ = 'knowledge_base_articles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = db.relationship('User', backref='knowledge_articles')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'author_id': self.author_id,
            'author': {
                'id': self.author.id,
                'username': self.author.username,
                'email': self.author.email
            } if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def init_default_articles():
        """Initialize default knowledge base articles"""
        if KnowledgeBaseArticle.query.count() == 0:
            # Find admin user
            from src.models.user import User
            admin_user = User.query.filter_by(role='admin').first()
            if not admin_user:
                return
            
            default_articles = [
                {
                    'title': 'Как создать заявку в службу поддержки',
                    'content': '''# Как создать заявку в службу поддержки

## Шаг 1: Войдите в систему
Используйте ваши учетные данные для входа в систему поддержки.

## Шаг 2: Перейдите к созданию заявки
Нажмите кнопку "Создать заявку" на главной странице.

## Шаг 3: Заполните форму
- **Заголовок**: Кратко опишите проблему
- **Описание**: Подробно опишите проблему, включая:
  - Что вы пытались сделать
  - Что произошло вместо ожидаемого результата
  - Шаги для воспроизведения проблемы
- **Приоритет**: Выберите соответствующий уровень приоритета

## Шаг 4: Отправьте заявку
Нажмите "Создать заявку" для отправки.

## Что происходит дальше?
- Ваша заявка получит уникальный номер
- Администратор назначит исполнителя
- Вы получите уведомление о назначении
- Исполнитель свяжется с вами для решения проблемы''',
                    'category': 'Инструкции',
                    'author_id': admin_user.id
                },
                {
                    'title': 'Часто задаваемые вопросы (FAQ)',
                    'content': '''# Часто задаваемые вопросы

## Общие вопросы

### Как долго обрабатывается заявка?
Время обработки зависит от приоритета:
- **Критический**: до 1 часа
- **Высокий**: до 4 часов  
- **Средний**: до 1 рабочего дня
- **Низкий**: до 3 рабочих дней

### Могу ли я изменить заявку после создания?
Нет, но вы можете добавить дополнительную информацию через сообщения в заявке.

### Как отследить статус заявки?
Войдите в систему и перейдите в раздел "Мои заявки". Там вы увидите текущий статус всех ваших заявок.

## Технические вопросы

### Забыл пароль, что делать?
Обратитесь к администратору системы для сброса пароля.

### Не могу войти в систему
1. Проверьте правильность ввода логина и пароля
2. Убедитесь, что Caps Lock выключен
3. Попробуйте очистить кэш браузера
4. Если проблема сохраняется, создайте заявку или обратитесь к администратору

### Система работает медленно
1. Проверьте скорость интернет-соединения
2. Закройте ненужные вкладки браузера
3. Попробуйте обновить страницу
4. Если проблема сохраняется, сообщите об этом в службу поддержки''',
                    'category': 'FAQ',
                    'author_id': admin_user.id
                },
                {
                    'title': 'Устранение проблем с входом в систему',
                    'content': '''# Устранение проблем с входом в систему

## Симптомы
- Не удается войти в систему
- Ошибка "Неверные учетные данные"
- Страница входа не загружается

## Возможные причины и решения

### 1. Неправильные учетные данные
**Решение:**
- Убедитесь, что вводите правильный логин и пароль
- Проверьте раскладку клавиатуры
- Убедитесь, что Caps Lock выключен

### 2. Проблемы с браузером
**Решение:**
- Очистите кэш и cookies браузера
- Попробуйте войти в режиме инкогнито
- Обновите браузер до последней версии
- Попробуйте другой браузер

### 3. Проблемы с сетью
**Решение:**
- Проверьте интернет-соединение
- Попробуйте перезагрузить роутер
- Обратитесь к системному администратору

### 4. Заблокированная учетная запись
**Решение:**
- Обратитесь к администратору системы
- Возможно, потребуется разблокировка аккаунта

## Если ничего не помогает
Создайте заявку в службу поддержки с описанием:
- Какой браузер используете
- Какую ошибку видите
- Когда проблема началась
- Что вы уже пробовали сделать''',
                    'category': 'Устранение неполадок',
                    'author_id': admin_user.id
                }
            ]
            
            for article_data in default_articles:
                article = KnowledgeBaseArticle(**article_data)
                db.session.add(article)
            
            db.session.commit()

