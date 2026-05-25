from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from shop.models import Brand

User = get_user_model()


BRANDS = [
    {'name': 'Venum', 'description': 'Premium combat sports equipment and apparel'},
    {'name': 'Hayabusa', 'description': 'High-performance martial arts gear'},
    {'name': 'Everlast', 'description': 'Legendary boxing and fitness brand since 1910'},
    {'name': 'Nike', 'description': 'Global leader in athletic footwear and apparel'},
    {'name': 'Fairtex', 'description': 'World-renowned Muay Thai equipment'},
    {'name': 'Twins Special', 'description': 'Premium Thai boxing gloves and gear'},
    {'name': 'Rival Boxing', 'description': 'Technical boxing equipment for fighters'},
    {'name': 'Cleto Reyes', 'description': 'Handcrafted Mexican boxing gloves since 1945'},
    {'name': 'Adidas', 'description': 'German sportswear and combat gear'},
    {'name': 'Yokkao', 'description': 'Premium Muay Thai apparel and equipment'},
    {'name': 'RDX Sports', 'description': 'Affordable combat sports equipment'},
    {'name': 'Title Boxing', 'description': 'Complete boxing and MMA equipment supplier'},
    {'name': 'Sanabul', 'description': 'Modern Brazilian Jiu-Jitsu and MMA gear'},
    {'name': 'Shock Doctor', 'description': 'Protective sports gear and mouthguards'},
    {'name': 'Bad Boy', 'description': 'Iconic MMA and fight wear brand'},
]


class Command(BaseCommand):
    help = 'Seeds major sports brands into the database'

    def handle(self, *args, **options):
        created_count = 0
        for brand_data in BRANDS:
            _, created = Brand.objects.update_or_create(
                name=brand_data['name'],
                defaults={
                    'description': brand_data['description'],
                    'is_approved': True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created brand: {brand_data["name"]}'))
            else:
                self.stdout.write(f'Already exists: {brand_data["name"]}')

        self.stdout.write(self.style.SUCCESS(f'Done. {created_count} new brand(s) created.'))
