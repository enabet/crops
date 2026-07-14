docker compose exec backend python manage.py shell -c "
from apps.accounts.models import User;
User.objects.create_superuser(
    email='user@gmail.com',
    password='ChangeMe123!',
    first_name='System',
    last_name='Administrator'
)