import random

from django.core.management.base import BaseCommand

from core.models import User


class Command(BaseCommand):
    help = "Seed the database with fake users"

    def handle(self, *args, **kwargs):
        for i in range(0, 20):
            user = User.objects.create(
                first_name="Account",
                last_name=f"Developer {i}",
                role=1,
                email=f"tientungtang2004+{i}@gmail.com",
            )
            user.set_password("Defaultpassword@123")
            user.save()

        self.stdout.write(self.style.SUCCESS("Successfully user seeded database"))
