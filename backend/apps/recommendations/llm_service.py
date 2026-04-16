from django.conf import settings
from groq import Groq


def fallback(risk, lang="en"):
    messages = {
        "en": {
            3: "Avoid outdoor exposure due to high pollution.",
            2: "Limit outdoor activity.",
            1: "Air quality is moderate.",
            0: "Air quality is safe.",
        },
        "ru": {
            3: "Избегайте пребывания на улице из-за высокого уровня загрязнения.",
            2: "Ограничьте активность на улице.",
            1: "Качество воздуха умеренное.",
            0: "Качество воздуха безопасное.",
        },
        "kz": {
            3: "Ластану жоғары болғандықтан сыртта болудан аулақ болыңыз.",
            2: "Сырттағы белсенділікті шектеңіз.",
            1: "Ауа сапасы орташа деңгейде.",
            0: "Ауа сапасы қауіпсіз.",
        },
    }
    language_messages = messages.get(lang, messages["en"])
    if risk == 3:
        return language_messages[3]
    if risk == 2:
        return language_messages[2]
    if risk == 1:
        return language_messages[1]
    return language_messages[0]


def generate_ai_recommendation(user, air, risk, lang="en"):
    profile = getattr(user, "profile", None)
    sensitivity = getattr(profile, "sensitivity_level", "normal")
    age_group = getattr(profile, "age_group", "adult")
    if not getattr(settings, "GROQ_API_KEY", ""):
        return fallback(risk, lang)

    client = Groq(api_key=settings.GROQ_API_KEY)

    prompt = f"""
Generate a personalized air quality recommendation.

Language: {lang}

User:
- sensitivity: {sensitivity}
- age: {age_group}

Environment:
- AQI: {air['aqi']}
- PM2.5: {air['pm25']}
- PM10: {air['pm10']}

Risk level: {risk}

Rules:
- Respond ONLY in {lang}
- If lang is "ru" -> Russian
- If lang is "kz" -> Kazakh
- If lang is "en" -> English
- Max 3 sentences
- Direct, natural speech
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_completion_tokens=120,
        )

        text = completion.choices[0].message.content.strip()

        if not text:
            return fallback(risk, lang)

        return text

    except Exception as e:
        print("Groq exception:", str(e))
        return fallback(risk, lang)
