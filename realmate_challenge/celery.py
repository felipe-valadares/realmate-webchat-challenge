import os
from celery import Celery

# Definir variável de ambiente para configurações do Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realmate_challenge.settings')

app = Celery('realmate_challenge')
# Configurar broker e backend de resultados usando variáveis de ambiente
app.conf.broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')
app.conf.result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')

# Carregar configurações do Django
app.config_from_object('django.conf:settings', namespace='CELERY')
# Descobrir automaticamente tasks em apps registradas
app.autodiscover_tasks() 