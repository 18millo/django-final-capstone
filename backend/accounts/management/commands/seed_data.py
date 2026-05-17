from django.core.management.base import BaseCommand
from django.utils.crypto import get_random_string
from django.utils.text import slugify
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.apps import apps
from accounts.models import User
from products.models import Category, Product

COACHES = [
    ('John Kavanagh', 'SBG Ireland', 'Renowned MMA coach known for developing elite fighters like Conor McGregor.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'),
    ('Firas Zahabi', 'Tristar Gym', 'Esteemed jiu-jitsu and MMA coach, head coach at Tristar Gym in Montreal.', 'https://images.unsplash.com/photo-1551854767-5c1d86901a29?auto=format&fit=crop&w=400&q=80'),
    ('Javier Mendez', 'AKA', 'Legendary MMA coach from American Kickboxing Academy, coached numerous UFC champions.', 'https://images.unsplash.com/photo-1526417368026-37965d4ac7d3?auto=format&fit=crop&w=400&q=80'),
    ('Greg Jackson', 'Jackson Wink MMA', 'Highly respected MMA coach, founder of Jackson Wink MMA and coach to many champions.', 'https://images.unsplash.com/photo-1551836022-5d886d93bb3b?auto=format&fit=crop&w=400&q=80'),
    ('Henri Hooft', 'Blackzilians', 'World-class Muay Thai and kickboxing coach, known for technical precision.', 'https://images.unsplash.com/photo-1582719478250-59192cfcf1b3?auto=format&fit=crop&w=400&q=80'),
    ('Rafael Cordeiro', 'Kings MMA', 'Acclaimed MMA coach specializing in striking, founder of Kings MMA.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80'),
    ('Marcos Parrumpinha', 'American Top Team', 'Accomplished BJJ and MMA coach, head coach at American Top Team.', 'https://images.unsplash.com/photo-1574158622682-44bfe49dde9e?auto=format&fit=crop&w=400&q=80'),
    ('Duke Roufus', 'Roufusport', 'Celebrated striking coach known for developing elite kickboxers and MMA fighters.', 'https://images.unsplash.com/photo-1581092758877-88e041f799fd?auto=format&fit=crop&w=400&q=80'),
    ('Trevor Wittman', 'ONX Sports', 'Innovative MMA and boxing coach, renowned for unique training methods.', 'https://images.unsplash.com/photo-1593642532835-2dbb7f51f8bb?auto=format&fit=crop&w=400&q=80'),
    ('Eric Nicksick', 'Xtreme Couture', 'Top MMA and wrestling coach, known for developing well-rounded fighters.', 'https://images.unsplash.com/photo-1574800129488-0b4b8ae04cad?auto=format&fit=crop&w=400&q=80'),
]

VENDORS = [
    ('Hayabusa', 'hayabusa'),
    ('Fairtex', 'fairtex'),
    ('Venum', 'venum'),
    ('Everlast', 'everlast'),
]

CATEGORIES = [
    ('Gloves', 'gloves', 'boxing'),
    ('Wraps & Hand Protection', 'wraps', 'boxing'),
    ('Shin Guards', 'shin-guards', 'muay-thai'),
    ('Shorts', 'shorts', 'mma'),
    ('Rash Guards', 'rash-guards', 'bjj'),
    ('Gi', 'gi', 'bjj'),
    ('Mouthguards', 'mouthguards', 'boxing'),
    ('Headgear', 'headgear', 'boxing'),
    ('Punching Bags', 'punching-bags', 'boxing'),
    ('Focus Mitts & Pads', 'focus-mitts', 'boxing'),
    ('Jump Ropes', 'jump-ropes', 'boxing'),
    ('Weighted Vests', 'weighted-vests', 'fitness'),
]

U = 'https://images.unsplash.com/photo-'
P = 'https://images.pexels.com/photos/'

IMAGES = {
    'red-gloves':       P + '10689269/pexels-photo-10689269.jpeg?auto=compress&cs=tinysrgb&w=600',
    'black-gloves':     U + '1571902943202-507ec2618e8f?auto=format&fit=crop&w=600&q=80',
    'white-gloves':     U + '1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80',
    'gold-gloves':      U + '1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
    'blue-gloves':      U + '1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80',
    'wraps':            P + '1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=600',
    'shorts':           U + '1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80',
    'rash':             U + '1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
    'gi':               P + '8173277/pexels-photo-8173277.jpeg?auto=compress&cs=tinysrgb&w=600',
    'shin':             U + '1599058917765-a780eda07a3e?auto=format&fit=crop&w=600&q=80',
    'mouth':            U + '1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
    'bag':              P + '4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=600',
    'rope':             U + '1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80',
    'headgear':         P + '2608791/pexels-photo-2608791.jpeg?auto=compress&cs=tinysrgb&w=600',
    'vest':             P + '7697773/pexels-photo-7697773.jpeg?auto=compress&cs=tinysrgb&w=600',
    'pads':             P + '6296115/pexels-photo-6296115.jpeg?auto=compress&cs=tinysrgb&w=600',
    'pads2':            P + '3644515/pexels-photo-3644515.jpeg?auto=compress&cs=tinysrgb&w=600',
}

PRODUCTS = [
    # (vendor_name, cat_name, name, price, image_key)
    # Hayabusa Gloves
    ('Hayabusa', 'Gloves', 'T3 Boxing Gloves', 149.99, 'red-gloves'),
    ('Hayabusa', 'Gloves', 'T3 LX Boxing Gloves', 179.99, 'black-gloves'),
    ('Hayabusa', 'Gloves', 'Kanpe Boxing Gloves', 129.99, 'red-gloves'),
    ('Hayabusa', 'Gloves', 'S4 Sparring Gloves', 139.99, 'black-gloves'),
    ('Hayabusa', 'Gloves', 'Pro Series Boxing Gloves', 199.99, 'white-gloves'),
    # Hayabusa Wraps
    ('Hayabusa', 'Wraps & Hand Protection', 'Hand Wraps 180"', 14.99, 'wraps'),
    ('Hayabusa', 'Wraps & Hand Protection', 'Quick Wraps Sleeves', 24.99, 'wraps'),
    ('Hayabusa', 'Wraps & Hand Protection', 'Gel Inner Gloves', 34.99, 'wraps'),
    ('Hayabusa', 'Wraps & Hand Protection', 'Pro Hand Wraps 200"', 19.99, 'wraps'),
    # Hayabusa Shorts
    ('Hayabusa', 'Shorts', 'Pro Fight Shorts', 69.99, 'shorts'),
    ('Hayabusa', 'Shorts', 'Muay Thai Shorts', 59.99, 'shorts'),
    ('Hayabusa', 'Shorts', 'Grappling Shorts', 64.99, 'shorts'),
    # Hayabusa Rash Guards
    ('Hayabusa', 'Rash Guards', 'Compression Rash Guard', 59.99, 'rash'),
    ('Hayabusa', 'Rash Guards', 'Long Sleeve Rash Guard', 64.99, 'rash'),
    ('Hayabusa', 'Rash Guards', 'Short Sleeve Rash Guard', 54.99, 'rash'),

    # Fairtex Gloves
    ('Fairtex', 'Gloves', 'BGV1 Boxing Gloves', 109.99, 'gold-gloves'),
    ('Fairtex', 'Gloves', 'BGV9 Boxing Gloves', 129.99, 'blue-gloves'),
    ('Fairtex', 'Gloves', 'BGV14 Sparring Gloves', 119.99, 'red-gloves'),
    ('Fairtex', 'Gloves', 'BGV19 Muay Thai Gloves', 134.99, 'black-gloves'),
    ('Fairtex', 'Gloves', 'Mexican Style Boxing Gloves', 144.99, 'blue-gloves'),
    # Fairtex Shin Guards
    ('Fairtex', 'Shin Guards', 'SP5 Muay Thai Shin Guards', 89.99, 'shin'),
    ('Fairtex', 'Shin Guards', 'SP8 Pro Shin Guards', 109.99, 'shin'),
    ('Fairtex', 'Shin Guards', 'SP3 Super Save Shin Guards', 79.99, 'shin'),
    # Fairtex Shorts
    ('Fairtex', 'Shorts', 'Pro Muay Thai Shorts', 54.99, 'shorts'),
    ('Fairtex', 'Shorts', 'Satin Fight Shorts', 49.99, 'shorts'),
    # Fairtex Mitts & Pads
    ('Fairtex', 'Focus Mitts & Pads', 'Thai Focus Mitts', 44.99, 'pads'),
    ('Fairtex', 'Focus Mitts & Pads', 'Pro Kick Shield', 89.99, 'pads2'),
    ('Fairtex', 'Focus Mitts & Pads', 'Curved Kick Pad', 69.99, 'pads2'),
    ('Fairtex', 'Focus Mitts & Pads', 'Boxing Focus Pads', 39.99, 'pads'),
    # Fairtex Punching Bags
    ('Fairtex', 'Punching Bags', 'Heavy Bag 100lb', 179.99, 'bag'),
    ('Fairtex', 'Punching Bags', 'Free Standing Bag', 249.99, 'bag'),
    ('Fairtex', 'Punching Bags', 'Water Filled Bag', 199.99, 'bag'),

    # Venum Gloves
    ('Venum', 'Gloves', 'Challenger 2.0 Boxing Gloves', 89.99, 'white-gloves'),
    ('Venum', 'Gloves', 'Elite Boxing Gloves', 129.99, 'gold-gloves'),
    ('Venum', 'Gloves', 'Giant 3.0 Boxing Gloves', 159.99, 'white-gloves'),
    ('Venum', 'Gloves', 'Predator Boxing Gloves', 179.99, 'red-gloves'),
    ('Venum', 'Gloves', 'Hammer Boxing Gloves', 109.99, 'black-gloves'),
    # Venum Headgear
    ('Venum', 'Headgear', 'Challenger Headgear', 69.99, 'headgear'),
    ('Venum', 'Headgear', 'Elite Headgear', 99.99, 'headgear'),
    ('Venum', 'Headgear', 'Predator Headgear', 119.99, 'headgear'),
    # Venum Rash Guards
    ('Venum', 'Rash Guards', 'Compression Top', 54.99, 'rash'),
    ('Venum', 'Rash Guards', 'Venum Elite Rash Guard', 69.99, 'rash'),
    ('Venum', 'Rash Guards', 'Contender Rash Guard', 59.99, 'rash'),
    # Venum Shorts
    ('Venum', 'Shorts', 'Contender Fight Shorts', 59.99, 'shorts'),
    ('Venum', 'Shorts', 'Elite Muay Thai Shorts', 64.99, 'shorts'),
    ('Venum', 'Shorts', 'Wolf Grappling Shorts', 54.99, 'shorts'),

    # Everlast Gloves
    ('Everlast', 'Gloves', 'Pro Style Boxing Gloves', 79.99, 'blue-gloves'),
    ('Everlast', 'Gloves', 'PowerLock Training Gloves', 99.99, 'gold-gloves'),
    ('Everlast', 'Gloves', 'Elite Pro Style Gloves', 139.99, 'blue-gloves'),
    ('Everlast', 'Gloves', 'MX Professional Gloves', 169.99, 'red-gloves'),
    ('Everlast', 'Gloves', 'Protex3 Training Gloves', 59.99, 'black-gloves'),
    # Everlast Mouthguards
    ('Everlast', 'Mouthguards', 'Pro Mouthguard', 24.99, 'mouth'),
    ('Everlast', 'Mouthguards', 'Double Tech Mouthguard', 34.99, 'mouth'),
    ('Everlast', 'Mouthguards', 'Custom Fit Mouthguard Kit', 19.99, 'mouth'),
    # Everlast Jump Ropes
    ('Everlast', 'Jump Ropes', 'Speed Rope', 14.99, 'rope'),
    ('Everlast', 'Jump Ropes', 'Pro Leather Speed Rope', 24.99, 'rope'),
    ('Everlast', 'Jump Ropes', 'Weighted Jump Rope', 19.99, 'rope'),
    # Everlast Weighted Vests
    ('Everlast', 'Weighted Vests', 'Adjustable Weighted Vest 20lb', 89.99, 'vest'),
    ('Everlast', 'Weighted Vests', 'Weighted Vest 40lb', 129.99, 'vest'),
    ('Everlast', 'Weighted Vests', 'Weighted Vest 60lb', 159.99, 'vest'),
    # Everlast Focus Mitts & Pads
    ('Everlast', 'Focus Mitts & Pads', 'Pro Focus Mitts', 34.99, 'pads'),
    ('Everlast', 'Focus Mitts & Pads', 'Double End Bag', 69.99, 'bag'),
    ('Everlast', 'Focus Mitts & Pads', 'Heavy Hook & Jab Pad', 49.99, 'pads2'),
]


class Command(BaseCommand):
    help = 'Seed sample coaches, vendors, categories, and products'

    def handle(self, *args, **options):
        created_coaches = []
        for name, gym, bio, image_url in COACHES:
            email = name.lower().replace(' ', '.').replace("'", '') + '@combathub.io'
            username = name.lower().replace(' ', '_').replace("'", '')
            if User.objects.filter(email=email).exists():
                self.stdout.write(f'  Coach {email} already exists, skipping')
                # update existing coach profile fields
                existing = User.objects.get(email=email)
                profile = existing.profile
                if not profile.specialization:
                    profile.specialization = 'MMA'
                    profile.certifications = 'Certified MMA Coach, BJJ Black Belt'
                    if not profile.bio:
                        profile.bio = bio
                    profile.save()
                continue
            user = User.objects.create(
                email=email,
                username=username,
                display_name=name,
                role='coach',
                is_active=True,
            )
            password = get_random_string(12)
            user.set_password(password)
            user.save()
            # Update profile with bio and avatar
            profile = user.profile
            profile.bio = bio
            profile.specialization = 'MMA'
            profile.certifications = 'Certified MMA Coach, BJJ Black Belt'
            # Try to set avatar as URL (may work for display via serializer)
            profile.avatar = image_url
            profile.save()
            created_coaches.append((email, password, name, gym))
            self.stdout.write(f'  Coach: {email} / {password}')

        if created_coaches:
            with open('/home/levi/Documents/django_projects/capstone/coaches.txt', 'w') as f:
                f.write('CombatHub Sample Coach Accounts\n')
                f.write('=' * 40 + '\n\n')
                for email, password, name, gym in created_coaches:
                    f.write(f'Name:     {name}\n')
                    f.write(f'Gym:      {gym}\n')
                    f.write(f'Email:    {email}\n')
                    f.write(f'Password: {password}\n\n')
            self.stdout.write(self.style.SUCCESS(f'Wrote {len(created_coaches)} coach credentials to coaches.txt'))
        else:
            self.stdout.write('  No new coaches created')

        created_vendors = []
        vendor_map = {}
        for name, email_prefix in VENDORS:
            email = email_prefix + '@combathub.io'
            user = User.objects.filter(email=email).first()
            if user:
                self.stdout.write(f'  Vendor {email} already exists, skipping')
                vendor_map[name] = user
                # update existing vendor profile fields
                profile = user.profile
                if not profile.business_name:
                    profile.business_name = name
                    profile.business_location = 'Worldwide'
                    profile.business_description = f'{name} is a leading manufacturer of premium combat sports gear and equipment.'
                    profile.save()
                continue
            user = User.objects.create(
                email=email,
                username=email_prefix,
                display_name=name + ' Gear',
                role='vendor',
                is_active=True,
            )
            password = 'vendor123'
            user.set_password(password)
            user.save()
            # update vendor profile
            profile = user.profile
            profile.business_name = name
            profile.business_location = 'Worldwide'
            profile.business_description = f'{name} is a leading manufacturer of premium combat sports gear and equipment.'
            profile.save()
            created_vendors.append((email, password, name))
            vendor_map[name] = user
            self.stdout.write(f'  Vendor: {email} / {password}')

        if created_vendors:
            self.stdout.write(self.style.SUCCESS(f'Created {len(created_vendors)} vendors'))
        else:
            self.stdout.write('  No new vendors created')

        cat_map = {}
        for name, slug, sport in CATEGORIES:
            cat, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'sport_tag': sport},
            )
            cat_map[name] = cat

        total_products = 0
        for name, cat_name, title, price, img_key in PRODUCTS:
            vendor = vendor_map.get(name)
            if not vendor:
                self.stdout.write(f'  Vendor {name} not found, skipping')
                continue
            category = cat_map.get(cat_name)
            slug_base = slugify(title)
            slug = slug_base
            n = 1
            while Product.objects.filter(slug=slug).exists():
                existing = Product.objects.get(slug=slug)
                if existing.name == title and existing.brand == name and existing.vendor == vendor:
                    existing.images = [IMAGES[img_key]]
                    existing.price = price
                    existing.save()
                    total_products += 1
                    break
                slug = f'{slug_base}-{n}'
                n += 1
            else:
                Product.objects.create(
                    name=title,
                    slug=slug,
                    category=category,
                    brand=name,
                    vendor=vendor,
                    price=price,
                    stock=50,
                    images=[IMAGES[img_key]],
                    description=f'Premium {title.lower()} from {name}. Top-quality combat sports gear designed for athletes.',
                )
                total_products += 1

        self.stdout.write(self.style.SUCCESS(f'Created {total_products} products across {len(vendor_map)} vendors'))

        from accounts.models import VendorAccessCode
        VendorAccessCode.objects.get_or_create(
            code='VENDOR2024',
            defaults={'description': 'Default vendor access code'}
        )
        self.stdout.write(self.style.SUCCESS('Seeded vendor access code'))
