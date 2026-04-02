from django.contrib.auth.models import BaseUserManager
from .querysets import UserQuerySet


class SoftDeleteUserManager(BaseUserManager):
    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        user = self.model(email=email.lower(), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", 1)

        return self.create_user(email, password, **extra_fields)


class GlobalUserManager(BaseUserManager):
    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db)


class DeletedUserManager(BaseUserManager):
    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db).filter(deleted_at__isnull=False)
