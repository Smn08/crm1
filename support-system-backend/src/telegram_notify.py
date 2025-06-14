import requests

TELEGRAM_BOT_TOKEN = '7677429268:AAHOiHsgl9QsXNDeWMAVLp1B3_boWX2gRIA'
TELEGRAM_CHAT_ID = '325766176'


def send_telegram_message(text: str, chat_id: str = TELEGRAM_CHAT_ID):
    """
    Отправить уведомление в Telegram через бота.
    text: текст сообщения
    chat_id: id чата (можно передавать для разных пользователей)
    """
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True
    }
    try:
        response = requests.post(url, data=payload, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Ошибка отправки в Telegram: {e}")
        return None

# Пример использования:
# send_telegram_message('Тестовое уведомление!')
