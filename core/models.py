import uuid
from django.contrib.auth.models import AbstractBaseUser
from django.core.validators import FileExtensionValidator
from django.db import models
from django_extensions.db.models import TimeStampedModel
from django_softdelete.models import SoftDeleteModel
from .managers import DeletedUserManager, GlobalUserManager, SoftDeleteUserManager

from core.constant import USER_DEFAULT_SYSTEM, NotificationTypeEnum

class User(AbstractBaseUser, TimeStampedModel, SoftDeleteModel):
    username = models.CharField(unique=True, null=True, max_length=255)
    first_name = models.CharField(max_length=255, null=True)
    last_name = models.CharField(max_length=255, null=True)
    is_active = models.BooleanField(default=True)
    role = models.IntegerField(default=1)
    avatar = models.ImageField(
        upload_to="avatar/",
        blank=True,
        default=None,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])
        ],
        max_length=255,
    )
    status = models.BooleanField(default=True)

    objects = SoftDeleteUserManager()
    global_objects = GlobalUserManager()
    deleted_objects = DeletedUserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["first_name", "last_name", "role", "password"]

    token_version = models.UUIDField(default=uuid.uuid4)

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.pk} {self.username}"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def set_new_token_version(self):
        """
        Set a new token version (UUID) for the User.
        """
        self.token_version = uuid.uuid4()
        self.save()

    def get_new_token_version(self) -> str:
        """
        Get a new token version (UUID) for the User.
        """
        return str(self.token_version)

    def is_token_version_valid(self, token_version: str) -> bool:
        return bool(self.get_new_token_version() == token_version)


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.SET_DEFAULT, default=USER_DEFAULT_SYSTEM, null=True
    )
    notify_type = models.IntegerField(
        default=NotificationTypeEnum.SYSTEM_NOTIFICATION.value
    )
    data = models.JSONField(null=True, blank=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.full_name} - {self.notify_type}"

    class Meta:
        db_table = "notifications"
        ordering = ["-created"]


class Set(models.Model):
    user = models.ForeignKey( User, on_delete=models.CASCADE, related_name="sets" )
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=255, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "sets"

    def __str__(self):
        return f"{self.title} {self.description} {self.is_public}"

class SetShare(models.Model):
    PERMISSION_CHOICES = (
        ("view", "View"),
        ("edit", "Edit"),
    )
    set = models.ForeignKey(Set, on_delete=models.CASCADE, related_name="shares")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shares")

    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sets_share"


class Question(models.Model):
    QUESTION_TYPE = (
        ("single", "Single Choice"),
        ("text", "Text Fill"),
        ("checkbox", "Check Box"),
    )
    set = models.ForeignKey(Set, on_delete=models.CASCADE, related_name="questions")

    title = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPE)

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "questions"

    def __str__ (self):
        return f"{self.set} {self.title} {self.type}"

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")

    content = models.TextField()
    is_correct = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "answers"
    
    def __str__(self):
        return f"{self.question} {self.content} {self.is_correct}"


class Quiz(models.Model):
    set = models.ForeignKey(Set, on_delete=models.CASCADE, related_name="quizzes")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    title = models.CharField(max_length=255)
    question_count = models.IntegerField()

    is_published = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quizzes"

    def __str__(self):
        return f"{self.set} {self.title} {self.question_count} {self.is_public}"


class QuizShare(models.Model):
    PERMISSION_CHOICES = (
        ("view", "View"),
        ("edit", "Edit"),
    )

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="shares")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "quizzes_share"

    def __str__(self):
        return f"{self.quiz} {self.permission}"


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="quiz_questions")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    title = models.TextField()
    type = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quizzes_question"

    def __str__(self):
        return f"{self.title} {self.type}"


class QuizQuestionAnswer(models.Model):
    quiz_question = models.ForeignKey(
        QuizQuestion,
        on_delete=models.CASCADE,
        related_name="answers"
    )

    content = models.TextField()
    is_correct = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quizzes_question_answer"

class Test(models.Model):
    STATUS_CHOICES = (
        ("in_progress", "In Progress"),
        ("submitted", "Submitted"),
        ("cancelled", "Cancelled"),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="tests")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    score = models.FloatField(default=0)

    time_spent = models.IntegerField(default=0)

    started_at = models.DateTimeField()
    last_answered_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tests"

    def __str__ (self):
        return f"{self.status} {self.score} {self.time_spent}"

class TestAnswer(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="answers")

    quiz_question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_answer = models.ForeignKey(
        QuizQuestionAnswer,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    is_correct = models.BooleanField(default=False)
    time_spent = models.IntegerField(default=0)

    class Meta:
        db_table = "tests_answer"
