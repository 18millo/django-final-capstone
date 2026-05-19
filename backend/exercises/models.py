from django.db import models


class Exercise(models.Model):
    CATEGORIES = [
        ('striking', 'Striking'),
        ('grappling', 'Grappling'),
        ('conditioning', 'Conditioning'),
        ('drill', 'Drill'),
        ('stretch', 'Stretching'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='drill')
    difficulty = models.CharField(max_length=12, choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], default='beginner')
    video_url = models.URLField(blank=True)
    image = models.ImageField(upload_to='exercises/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
