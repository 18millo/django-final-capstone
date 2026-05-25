from decimal import Decimal
from django.core.management.base import BaseCommand
from shop.models import VendorPremiumPlan


PLANS = [
    {
        'name': 'Free',
        'slug': 'free',
        'description': 'Get started with basic selling — list up to 5 products.',
        'price': Decimal('0.00'),
        'interval': '',
        'max_products': 5,
        'max_images_per_product': 3,
        'discounts_allowed': False,
        'analytics_available': False,
        'is_free': True,
        'sort_order': 0,
    },
    {
        'name': 'Basic',
        'slug': 'basic',
        'description': 'Essential selling tools for growing vendors — list up to 50 products with discounts.',
        'price': Decimal('19.99'),
        'interval': 'month',
        'max_products': 50,
        'max_images_per_product': 6,
        'discounts_allowed': True,
        'analytics_available': False,
        'is_free': False,
        'sort_order': 1,
    },
    {
        'name': 'Pro',
        'slug': 'pro',
        'description': 'Unlock full analytics, unlimited products, and premium support.',
        'price': Decimal('49.99'),
        'interval': 'month',
        'max_products': 9999,
        'max_images_per_product': 12,
        'discounts_allowed': True,
        'analytics_available': True,
        'is_free': False,
        'sort_order': 2,
    },
]


class Command(BaseCommand):
    help = 'Seed default vendor premium plans'

    def handle(self, *args, **options):
        for data in PLANS:
            obj, created = VendorPremiumPlan.objects.update_or_create(
                slug=data['slug'],
                defaults=data,
            )
            if created:
                self.stdout.write(f'Created plan: {obj.name}')
            else:
                self.stdout.write(f'Updated plan: {obj.name}')
