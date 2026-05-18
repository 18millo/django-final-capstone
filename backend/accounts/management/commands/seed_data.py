import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils.crypto import get_random_string
from django.utils.text import slugify
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.apps import apps
from accounts.models import User, Post, GalleryItem
from products.models import Category, Product


def _download(url):
    try:
        return urllib.request.urlopen(url, timeout=10).read()
    except Exception:
        return None


def _save_avatar(user, image_url):
    if not image_url:
        return
    data = _download(image_url)
    if not data:
        return
    ext = '.jpg'
    for e in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
        if e in image_url.lower():
            ext = e
            break
    user.profile.avatar.save(f'avatar_{user.username}{ext}', ContentFile(data), save=False)
    user.profile.save()

COACHES = [
    ('John Kavanagh', 'SBG Ireland', 'Renowned MMA coach known for developing elite fighters like Conor McGregor.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'),
    ('Firas Zahabi', 'Tristar Gym', 'Esteemed jiu-jitsu and MMA coach, head coach at Tristar Gym in Montreal.', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=400&q=80'),
    ('Javier Mendez', 'AKA', 'Legendary MMA coach from American Kickboxing Academy, coached numerous UFC champions.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80'),
    ('Greg Jackson', 'Jackson Wink MMA', 'Highly respected MMA coach, founder of Jackson Wink MMA and coach to many champions.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=400&q=80'),
    ('Henri Hooft', 'Blackzilians', 'World-class Muay Thai and kickboxing coach, known for technical precision.', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80'),
    ('Rafael Cordeiro', 'Kings MMA', 'Acclaimed MMA coach specializing in striking, founder of Kings MMA.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80'),
    ('Marcos Parrumpinha', 'American Top Team', 'Accomplished BJJ and MMA coach, head coach at American Top Team.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80'),
    ('Duke Roufus', 'Roufusport', 'Celebrated striking coach known for developing elite kickboxers and MMA fighters.', 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=400&q=80'),
    ('Trevor Wittman', 'ONX Sports', 'Innovative MMA and boxing coach, renowned for unique training methods.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80'),
    ('Eric Nicksick', 'Xtreme Couture', 'Top MMA and wrestling coach, known for developing well-rounded fighters.', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=400&q=80'),
]

VENDORS = [
    ('Hayabusa', 'hayabusa'),
    ('Fairtex', 'fairtex'),
    ('Venum', 'venum'),
    ('Everlast', 'everlast'),
]

GYMS = [
    ('SBG Ireland', 'sbg', 'Nairobi, Kenya', 'Premium MMA gym founded by John Kavanagh. Nairobi location now open! World-class training in the heart of Kenya.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80'),
    ('Tristar Gym', 'tristar', 'Mombasa, Kenya', 'World-renowned MMA gym led by Firas Zahabi. Our Mombasa facility offers elite training on the Kenyan coast.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80'),
    ('American Kickboxing Academy', 'aka', 'Nairobi, Kenya', 'Legendary fight team now training athletes in Nairobi. Kenyan fighters with world-class coaching.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=400&q=80'),
    ('Jackson Wink MMA', 'jacksonwink', 'Kisumu, Kenya', 'Premier MMA academy now open in Kisumu. Training champions from the lakeside city.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=400&q=80'),
    ('Kings MMA', 'kingsmma', 'Nairobi, Kenya', 'Top-tier MMA gym in Nairobi specializing in striking and conditioning. Kenyan champions start here.', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=400&q=80'),
    ('American Top Team', 'att', 'Nairobi, Kenya', 'One of the largest and most successful MMA gyms in the world. Now training athletes in Nairobi.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=400&q=80'),
    ('Roufusport', 'roufusport', 'Eldoret, Kenya', 'Celebrated striking academy now in Eldoret. High-altitude training meets world-class striking.', 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=400&q=80'),
    ('Xtreme Couture', 'xtremecouture', 'Nairobi, Kenya', 'Elite MMA gym in Nairobi known for producing well-rounded, high-level fighters. Sawa sawa!', 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=400&q=80'),
    ('Nova União', 'novauniao', 'Nairobi, Kenya', 'World-class BJJ and MMA academy. Nairobi location brings Brazilian Jiu-Jitsu excellence to East Africa.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80'),
    ('Team Alpha Male', 'teamalphamale', 'Nairobi, Kenya', 'Elite wrestling and MMA gym now in Kenya. Building the next generation of African fighters.', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80'),
    ('Chute Boxe', 'chuteboxe', 'Mombasa, Kenya', 'Legendary Muay Thai and MMA academy. Our Mombasa dojo brings the art of eight limbs to the coast.', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=400&q=80'),
    ('Bang Muay Thai', 'bangmuaythai', 'Kisumu, Kenya', 'Premier Muay Thai gym in Kisumu. Striking, clinch, and conditioning — traditional Muay Thai on Lake Victoria.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80'),
    ('Fight Ready', 'fightready', 'Eldoret, Kenya', 'High-altitude fight camp in Eldoret. Used by champion fighters for altitude training and conditioning.', 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=400&q=80'),
    ('City Kickboxing', 'citykickboxing', 'Nairobi, Kenya', 'New Zealand\'s premier striking gym now in Nairobi. Known for producing world champion kickboxers and MMA fighters.', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=400&q=80'),
    ('Tiger Muay Thai', 'tigermuaythai', 'Mombasa, Kenya', 'World-famous Muay Thai training camp. Our Mombasa location offers authentic Thai boxing on the Kenyan coast.', 'https://images.unsplash.com/photo-1599058918144-1ffedd8bf6db?auto=format&fit=crop&w=400&q=80'),
    ('Evolve MMA', 'evolve', 'Nairobi, Kenya', 'Asia\'s top MMA organization brings world-class training to Nairobi. Multiple disciplines under one roof.', 'https://images.unsplash.com/photo-1583473848882-f6408bcae1a7?auto=format&fit=crop&w=400&q=80'),
    ('Team Quest', 'teamquest', 'Kisumu, Kenya', 'Legendary MMA team now in Kisumu. Founded by MMA pioneers — bringing championship mentality to Lake Victoria.', 'https://images.unsplash.com/photo-1593914373223-63ea450e70a2?auto=format&fit=crop&w=400&q=80'),
    ('Scrap Iron MMA', 'scrapiron', 'Nakuru, Kenya', 'Tough, no-nonsense MMA gym in Nakuru. Building gritty fighters with a blue-collar work ethic.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80'),
    ('Syndicate MMA', 'syndicate', 'Nairobi, Kenya', 'Elite mixed martial arts gym in Nairobi. Producing well-rounded fighters with world-class coaching staff.', 'https://images.unsplash.com/photo-1591123120675-6f7f1a0e0d0e?auto=format&fit=crop&w=400&q=80'),
    ('Hard Knocks 365', 'hardknocks', 'Nairobi, Kenya', 'Premier MMA training facility. Our Nairobi location brings together the best coaches and fighters from around the world.', 'https://images.unsplash.com/photo-1599479012445-292c66fbf3f0?auto=format&fit=crop&w=400&q=80'),
    ('Cerro Negro MMA', 'cerronegro', 'Nanyuki, Kenya', 'Altitude training facility in Nanyuki. Specializing in high-altitude fight camps and conditioning for professional fighters.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80'),
    ('Pitbull Brothers', 'pitbullbrothers', 'Mombasa, Kenya', 'Brazilian Jiu-Jitsu and MMA academy in Mombasa. Known for aggressive grappling and submission-heavy game.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80'),
    ('Lion\'s Den', 'lionsden', 'Nairobi, Kenya', 'Historic MMA gym with a new home in Nairobi. One of the original MMA academies bringing old-school values to new fighters.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80'),
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

IMAGES = {
    'gloves-1':     'products/gloves/36732553206989316.jpeg',
    'gloves-2':     'products/gloves/44473115059409562.jpeg',
    'gloves-3':     'products/gloves/antonio-araujo-1iAGrJTlx0s-unsplash.jpg',
    'gloves-4':     'products/gloves/arisa-chattasa-HZbqhd5aK3I-unsplash.jpg',
    'gloves-5':     'products/gloves/engin-akyurt-ARntD1e8jyw-unsplash.jpg',
    'gloves-6':     'products/gloves/griffin-wooldridge-_kmFTZ3lcNM-unsplash.jpg',
    'gloves-7':     'products/gloves/quilia-WwrQnL0Gi1c-unsplash.jpg',
    'gloves-8':     'products/gloves/zane-burko-yYQwAKTN_34-unsplash.jpg',
    'boxing-shoes-1': 'products/boxing-shoes/175921929188135791.jpeg',
    'boxing-shoes-2': 'products/boxing-shoes/539095017905252435.jpeg',
    'boxing-shoes-3': 'products/boxing-shoes/Lightweight & Breathable Construction Engineered….jpeg',
    'boxing-shoes-4': 'products/boxing-shoes/PRICES MAY VARY_ 【 Ankle Protection 】_ This boxing….jpeg',
    'boxing-shoes-5': 'products/boxing-shoes/Stay grounded with superior grip and agility with….jpeg',
    'boxing-shoes-6': 'products/boxing-shoes/The Ringside Undefeated Boxing Shoes are….jpeg',
    'boxing-shoes-7': 'products/boxing-shoes/Venum Contender Boxing Shoes New In Box Brand New….jpeg',
    'boxing-shoes-8': 'products/boxing-shoes/Women\'s & Men\'s Clothing, Shop Online Fashion….jpeg',
    'pads-1':       'products/pads/1_2 Pieces Boxing Hand Target PU Leather Punching….jpeg',
    'pads-2':       'products/pads/539798705356144023.jpeg',
    'pads-3':       'products/pads/Boxing Focus Pad.jpeg',
    'pads-4':       'products/pads/bui-hoang-long-xGM9cXLgHmY-unsplash.jpg',
    'pads-5':       'products/pads/bui-hoang-long-y5-bgLrIwMs-unsplash.jpg',
    'pads-6':       'products/pads/DEAL OF THE WEEK_ Geezers PU Training Boxing Pads….jpeg',
    'pads-7':       'products/pads/Strengthen Comprehensive Training_Unleash your….jpeg',
    'punching-bags-1': 'products/punching-bags/10555380372342912.jpeg',
    'punching-bags-2': 'products/punching-bags/169518373469455874.jpeg',
    'punching-bags-3': 'products/punching-bags/61994932365743136.jpeg',
    'punching-bags-4': 'products/punching-bags/74520568829534191.jpeg',
    'punching-bags-5': 'products/punching-bags/Amazon_com _ Goplus Punching Bag with Stand for….jpeg',
    'punching-bags-6': 'products/punching-bags/anastase-maragos-zAE_6rJzavk-unsplash.jpg',
    'punching-bags-7': 'products/punching-bags/Get a total body workout whether you want cardio….jpeg',
    'punching-bags-8': 'products/punching-bags/Punching Bag available on best prices DM to Order….jpeg',
    'punching-bags-9': 'products/punching-bags/Solider Schaumstoffsack mit neuer und verbesserter….jpeg',
    'punching-bags-10': 'products/punching-bags/Speed Bag (Saco de velocidade).jpeg',
    'weight-vest-1': 'products/weight-vest/159455643064962408.jpeg',
    'weight-vest-2': 'products/weight-vest/190417890489140369.jpeg',
    'weight-vest-3': 'products/weight-vest/ADJUSTABLE WEIGHTED VEST_ APEXUP adjustable….jpeg',
    'weight-vest-4': 'products/weight-vest/FOR 30KG VEST, PM US FOR MORE INFORMATION IF….jpeg',
    'weight-vest-5': 'products/weight-vest/Level up any workout with this weighted training….jpeg',
    'wraps-1':      'products/wraps/1_5_3_5M Boxing Gloves Elastic Boxing Hand Wraps….jpeg',
    'wraps-2':      'products/wraps/173951604352415270.jpeg',
    'wraps-3':      'products/wraps/450711875227282472.jpeg',
    'wraps-4':      'products/wraps/ad eBay _ $18_99USD _ Perfect for Muay Thai & MMA….jpeg',
    'wraps-5':      'products/wraps/Amazon_com _ Hayabusa Gauze Boxing Hand Wraps for….jpeg',
    'wraps-6':      'products/wraps/ENGINEERED FOR CHAMPIONS The Adidas Boxing Crepe….jpeg',
    'wraps-7':      'products/wraps/PRICES MAY VARY_ 💪 【 Designed to endure】 hand….jpeg',
    'wraps-8':      'products/wraps/The Everlast Elite 180_ Boxing and MMA Handwraps….jpeg',
}

PRODUCTS = [
    # (vendor_name, cat_name, name, price, image_key)
    # Hayabusa Gloves
    ('Hayabusa', 'Gloves', 'T3 Boxing Gloves', 149.99, 'gloves-1'),
    ('Hayabusa', 'Gloves', 'T3 LX Boxing Gloves', 179.99, 'gloves-2'),
    ('Hayabusa', 'Gloves', 'Kanpe Boxing Gloves', 129.99, 'gloves-3'),
    ('Hayabusa', 'Gloves', 'S4 Sparring Gloves', 139.99, 'gloves-4'),
    ('Hayabusa', 'Gloves', 'Pro Series Boxing Gloves', 199.99, 'gloves-5'),
    # Hayabusa Wraps
    ('Hayabusa', 'Wraps & Hand Protection', 'Hand Wraps 180"', 14.99, 'wraps-1'),
    ('Hayabusa', 'Wraps & Hand Protection', 'Quick Wraps Sleeves', 24.99, 'wraps-2'),
    ('Hayabusa', 'Wraps & Hand Protection', 'Gel Inner Gloves', 34.99, 'wraps-3'),
    ('Hayabusa', 'Wraps & Hand Protection', 'Pro Hand Wraps 200"', 19.99, 'wraps-4'),
    # Hayabusa Pads
    ('Hayabusa', 'Focus Mitts & Pads', 'Pro Fight Pads', 69.99, 'pads-1'),
    ('Hayabusa', 'Focus Mitts & Pads', 'Muay Thai Pads', 59.99, 'pads-2'),
    ('Hayabusa', 'Focus Mitts & Pads', 'Grappling Pads', 64.99, 'pads-3'),

    # Fairtex Gloves
    ('Fairtex', 'Gloves', 'BGV1 Boxing Gloves', 109.99, 'gloves-6'),
    ('Fairtex', 'Gloves', 'BGV9 Boxing Gloves', 129.99, 'gloves-7'),
    ('Fairtex', 'Gloves', 'BGV14 Sparring Gloves', 119.99, 'gloves-8'),
    ('Fairtex', 'Gloves', 'BGV19 Muay Thai Gloves', 134.99, 'gloves-1'),
    ('Fairtex', 'Gloves', 'Mexican Style Boxing Gloves', 144.99, 'gloves-2'),
    # Fairtex Pads
    ('Fairtex', 'Focus Mitts & Pads', 'SP5 Muay Thai Pads', 89.99, 'pads-4'),
    ('Fairtex', 'Focus Mitts & Pads', 'SP8 Pro Pads', 109.99, 'pads-5'),
    ('Fairtex', 'Focus Mitts & Pads', 'SP3 Super Save Pads', 79.99, 'pads-6'),
    # Fairtex Shorts
    ('Fairtex', 'Shorts', 'Pro Muay Thai Shorts', 54.99, 'gloves-3'),
    ('Fairtex', 'Shorts', 'Satin Fight Shorts', 49.99, 'gloves-4'),
    # Fairtex Mitts & Pads
    ('Fairtex', 'Focus Mitts & Pads', 'Thai Focus Mitts', 44.99, 'pads-7'),
    ('Fairtex', 'Focus Mitts & Pads', 'Pro Kick Shield', 89.99, 'pads-1'),
    ('Fairtex', 'Focus Mitts & Pads', 'Curved Kick Pad', 69.99, 'pads-2'),
    ('Fairtex', 'Focus Mitts & Pads', 'Boxing Focus Pads', 39.99, 'pads-3'),
    # Fairtex Punching Bags
    ('Fairtex', 'Punching Bags', 'Heavy Bag 100lb', 179.99, 'punching-bags-1'),
    ('Fairtex', 'Punching Bags', 'Free Standing Bag', 249.99, 'punching-bags-2'),
    ('Fairtex', 'Punching Bags', 'Water Filled Bag', 199.99, 'punching-bags-3'),

    # Venum Gloves
    ('Venum', 'Gloves', 'Challenger 2.0 Boxing Gloves', 89.99, 'gloves-5'),
    ('Venum', 'Gloves', 'Elite Boxing Gloves', 129.99, 'gloves-6'),
    ('Venum', 'Gloves', 'Giant 3.0 Boxing Gloves', 159.99, 'gloves-7'),
    ('Venum', 'Gloves', 'Predator Boxing Gloves', 179.99, 'gloves-8'),
    ('Venum', 'Gloves', 'Hammer Boxing Gloves', 109.99, 'gloves-1'),
    # Venum Headgear
    ('Venum', 'Headgear', 'Challenger Headgear', 69.99, 'gloves-2'),
    ('Venum', 'Headgear', 'Elite Headgear', 99.99, 'gloves-3'),
    ('Venum', 'Headgear', 'Predator Headgear', 119.99, 'gloves-4'),
    # Venum Rash Guards
    ('Venum', 'Rash Guards', 'Compression Top', 54.99, 'gloves-5'),
    ('Venum', 'Rash Guards', 'Venum Elite Rash Guard', 69.99, 'gloves-6'),
    ('Venum', 'Rash Guards', 'Contender Rash Guard', 59.99, 'gloves-7'),
    # Venum Shorts
    ('Venum', 'Shorts', 'Contender Fight Shorts', 59.99, 'gloves-8'),
    ('Venum', 'Shorts', 'Elite Muay Thai Shorts', 64.99, 'gloves-1'),
    ('Venum', 'Shorts', 'Wolf Grappling Shorts', 54.99, 'gloves-2'),

    # Everlast Gloves
    ('Everlast', 'Gloves', 'Pro Style Boxing Gloves', 79.99, 'gloves-3'),
    ('Everlast', 'Gloves', 'PowerLock Training Gloves', 99.99, 'gloves-4'),
    ('Everlast', 'Gloves', 'Elite Pro Style Gloves', 139.99, 'gloves-5'),
    ('Everlast', 'Gloves', 'MX Professional Gloves', 169.99, 'gloves-6'),
    ('Everlast', 'Gloves', 'Protex3 Training Gloves', 59.99, 'gloves-7'),
    # Everlast Wraps
    ('Everlast', 'Wraps & Hand Protection', 'Pro Wraps', 24.99, 'wraps-5'),
    ('Everlast', 'Wraps & Hand Protection', 'Double Tech Wraps', 34.99, 'wraps-6'),
    ('Everlast', 'Wraps & Hand Protection', 'Custom Fit Wraps Kit', 19.99, 'wraps-7'),
    # Everlast Punching Bags
    ('Everlast', 'Punching Bags', 'Speed Bag', 14.99, 'punching-bags-4'),
    ('Everlast', 'Punching Bags', 'Pro Leather Bag', 24.99, 'punching-bags-5'),
    ('Everlast', 'Punching Bags', 'Weighted Bag', 19.99, 'punching-bags-6'),
    # Everlast Weighted Vests
    ('Everlast', 'Weighted Vests', 'Adjustable Weighted Vest 20lb', 89.99, 'weight-vest-1'),
    ('Everlast', 'Weighted Vests', 'Weighted Vest 40lb', 129.99, 'weight-vest-2'),
    ('Everlast', 'Weighted Vests', 'Weighted Vest 60lb', 159.99, 'weight-vest-3'),
    # Everlast Focus Mitts & Pads
    ('Everlast', 'Focus Mitts & Pads', 'Pro Focus Mitts', 34.99, 'pads-4'),
    ('Everlast', 'Focus Mitts & Pads', 'Double End Bag', 69.99, 'punching-bags-7'),
    ('Everlast', 'Focus Mitts & Pads', 'Heavy Hook & Jab Pad', 49.99, 'pads-5'),
]


class Command(BaseCommand):
    help = 'Seed sample coaches, vendors, categories, and products'

    ROLE_TO_GROUP = {
        'athlete': 'Reader',
        'coach': 'Author',
        'gym_owner': 'Author',
        'vendor': 'Author',
        'admin': 'Admin',
    }

    APP_LABELS = ['accounts', 'products', 'events', 'coaches', 'reviews', 'subscriptions', 'common', 'gyms', 'chat', 'comments', 'exercises']

    def create_groups_and_permissions(self):
        self.stdout.write(self.style.HTTP_INFO('Setting up RBAC groups and permissions...'))

        group_permissions = {
            'Reader': ['view'],
            'Author': ['view', 'add', 'change'],
            'Editor': ['view', 'add', 'change', 'delete'],
            'Admin': ['view', 'add', 'change', 'delete'],
        }

        all_permissions = {}
        for app_label in self.APP_LABELS:
            try:
                app_config = apps.get_app_config(app_label)
                for model in app_config.get_models():
                    content_type = ContentType.objects.get_for_model(model)
                    model_perms = Permission.objects.filter(content_type=content_type)
                    for perm in model_perms:
                        all_permissions[perm.codename] = perm
            except LookupError:
                pass

        for group_name, actions in group_permissions.items():
            group, created = Group.objects.get_or_create(name=group_name)
            perms_to_assign = []
            for codename, perm in all_permissions.items():
                for action in actions:
                    if codename.startswith(f'{action}_'):
                        perms_to_assign.append(perm)
                        break
            group.permissions.set(perms_to_assign)
            if created:
                self.stdout.write(f'  Created group: {group_name} with {len(perms_to_assign)} permissions')
            else:
                self.stdout.write(f'  Updated group: {group_name} with {len(perms_to_assign)} permissions')

    def assign_group_to_user(self, user):
        group_name = self.ROLE_TO_GROUP.get(user.role)
        if group_name:
            try:
                group = Group.objects.get(name=group_name)
                if group not in user.groups.all():
                    user.groups.add(group)
                    return True
            except Group.DoesNotExist:
                pass
        return False

    def create_admin_user(self):
        admin_email = 'admin@combathub.io'
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username': 'admin',
                'display_name': 'Admin',
                'role': 'admin',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'  Created admin user: {admin_email} / admin123'))
        else:
            if not admin_user.is_staff or not admin_user.is_superuser:
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()

        self.assign_group_to_user(admin_user)
        return admin_user

    def handle(self, *args, **options):
        self.create_groups_and_permissions()
        self.create_admin_user()

        created_coaches = []
        for name, gym, bio, image_url in COACHES:
            email = name.lower().replace(' ', '.').replace("'", '') + '@combathub.io'
            username = name.lower().replace(' ', '_').replace("'", '')
            if User.objects.filter(email=email).exists():
                self.stdout.write(f'  Coach {email} already exists, skipping')
                existing = User.objects.get(email=email)
                self.assign_group_to_user(existing)
                profile = existing.profile
                profile.specialization = 'MMA'
                profile.certifications = 'Certified MMA Coach, BJJ Black Belt'
                profile.bio = bio
                _save_avatar(existing, image_url)
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
            self.assign_group_to_user(user)
            # Update profile with bio and avatar
            profile = user.profile
            profile.bio = bio
            profile.specialization = 'MMA'
            profile.certifications = 'Certified MMA Coach, BJJ Black Belt'
            _save_avatar(user, image_url)
            profile.save()
            created_coaches.append((email, password, name, gym))
            self.stdout.write(f'  Coach: {email} / {password}')

        if created_coaches:
            self.stdout.write(self.style.SUCCESS(f'Created {len(created_coaches)} new coaches'))
        else:
            self.stdout.write('  No new coaches created')

        created_vendors = []
        vendor_map = {}
        for name, email_prefix in VENDORS:
            email = email_prefix + '@combathub.io'
            user = User.objects.filter(email=email).first()
            if user:
                self.stdout.write(f'  Vendor {email} already exists, skipping')
                self.assign_group_to_user(user)
                vendor_map[name] = user
                profile = user.profile
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
            self.assign_group_to_user(user)
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

        created_gyms = []
        for name, slug, location, description, image_url in GYMS:
            email = slug + '@combathub.io'
            if User.objects.filter(email=email).exists():
                self.stdout.write(f'  Gym owner {email} already exists, skipping')
                existing = User.objects.get(email=email)
                self.assign_group_to_user(existing)
                profile = existing.profile
                profile.business_name = name
                profile.business_location = location
                profile.business_description = description
                profile.is_premium = True
                _save_avatar(existing, image_url)
                profile.save()
                continue
            user = User.objects.create(
                email=email,
                username=slug,
                display_name=name,
                role='gym_owner',
                is_active=True,
            )
            password = 'gym123'
            user.set_password(password)
            user.save()
            self.assign_group_to_user(user)
            profile = user.profile
            profile.business_name = name
            profile.business_location = location
            profile.business_description = description
            profile.is_premium = True
            _save_avatar(user, image_url)
            profile.save()
            created_gyms.append((email, password, name))
            self.stdout.write(f'  Gym owner: {email} / {password}')

        if created_gyms:
            self.stdout.write(self.style.SUCCESS(f'Created {len(created_gyms)} new gym owners'))
        else:
            self.stdout.write('  No new gym owners created')

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

        forum_posts = [
            ('John Kavanagh', 'One of the most underrated aspects of MMA training is the mental game. Visualization, breathing drills, and meditation should be part of every fighter\'s weekly routine. The body follows the mind.'),
            ('John Kavanagh', 'Just wrapped up an incredible camp. Proud of the team\'s dedication. Remember: consistency beats intensity. Show up every day, even when you don\'t feel like it.'),
            ('Firas Zahabi', 'In jiu-jitsu, position before submission isn\'t just a saying — it\'s a law. Too many athletes rush the finish and lose control. Master the fundamentals and the submissions will come naturally.'),
            ('Firas Zahabi', 'The best training advice I can give: drill your weakest position until it becomes your strongest. Most people only train what they\'re good at. The real growth happens in discomfort.'),
            ('Javier Mendez', 'Footwork is the foundation of everything in MMA. If you can\'t control distance, you can\'t control the fight. Spend at least 15 minutes of every session on purely footwork drills.'),
            ('Javier Mendez', 'Proud to see our athletes evolving their striking game. The key is blending traditional boxing combinations with Muay Thai weapons. Mix it up and keep your opponent guessing.'),
            ('Greg Jackson', 'Game planning is 50% of winning. Study your opponent\'s tendencies, find the patterns, and build a strategy that exploits their weaknesses. But always have a Plan B — AND a Plan C.'),
            ('Greg Jackson', 'The clinch is a art form that too many fighters neglect. It\'s not just about dirty boxing — it\'s about controlling your opponent\'s posture, energy, and breathing. Master the clinch and you control the fight.'),
            ('Henri Hooft', 'Muay Thai leg kicks are a fight-changer. The key is technique — pivot on the ball of your foot, hips through, and connect with the shin. A well-placed leg kick removes your opponent\'s mobility by round 2.'),
            ('Henri Hooft', 'Dutch kickboxing philosophy: volume beats power. A hundred light strikes that land score more than one knockout punch that misses. Chain your combinations and keep constant pressure.'),
            ('Rafael Cordeiro', 'MMA is about transitions. The best fighters in the world are the ones who move seamlessly between striking, clinching, and grappling. Train the transitions, not just the individual positions.'),
            ('Rafael Cordeiro', 'Conditioning tip: don\'t just roadwork — mix in sport-specific intervals. 3 minutes of intense pad work, 1 minute rest. Repeat for 5 rounds. Simulate fight pace, not marathon pace.'),
            ('Marcos Parrumpinha', 'BJJ for MMA is different than sport BJJ. You don\'t need the berimbolo. You need takedown defense, sweeps from guard, and the ability to get back to your feet. Keep it practical.'),
            ('Marcos Parrumpinha', 'In American Top Team, we emphasize pressure passing. Smash your opponent\'s guard early, make them carry your weight, and break their will before you look for the submission.'),
            ('Duke Roufus', 'Striking is rhythm and rhythm is everything. Learn to break your opponent\'s rhythm with feints, level changes, and punch variations. A fighter who controls the tempo controls the fight.'),
            ('SBG Ireland', 'Karibu! SBG Nairobi is now open and accepting new athletes. Come train with the best coaches in East Africa. First class is free — let\'s build the Kenyan MMA scene together.'),
            ('Tristar Gym', 'Tristar Mombasa is proud to announce our upcoming grappling tournament. Open to all skill levels. Register at the front desk or DM for details.'),
            ('American Kickboxing Academy', 'AKA Nairobi is running a 6-week striking fundamentals course starting next month. Perfect for beginners looking to build a solid foundation in kickboxing.'),
            ('Jackson Wink MMA', 'Jackson Wink Kisumu — our new strength and conditioning program is live. Fight-specific training designed to build explosive power and endurance. Lake city athletes, let\'s go!'),
            ('Kings MMA', 'Kings MMA Nairobi is hosting a seminar on advanced Muay Thai techniques. Limited spots available. Come sharpen your striking with the best.'),
            ('American Top Team', 'ATT Nairobi is now offering youth MMA classes. Ages 8-16. Build confidence, discipline, and athleticism in a safe environment. Future Kenyan champions start here.'),
            ('Roufusport', 'Roufusport Eldoret facility upgrade complete! New mat space, updated heavy bag area, and a dedicated strength training zone. High-altitude training at its finest.'),
            ('Xtreme Couture', 'Join us at Xtreme Couture Nairobi for open mat every Sunday. All gyms welcome. Good vibes, great sparring, maji ya baridi inapatikana. Sawa sawa!'),
        ]

        created = 0
        skipped = 0
        for author_name, content in forum_posts:
            if Post.objects.filter(content=content).exists():
                skipped += 1
                continue
            author = User.objects.filter(display_name=author_name).first()
            if not author:
                author = User.objects.filter(username__startswith=author_name.lower().split()[0]).first()
            if not author:
                self.stdout.write(f'  Author "{author_name}" not found, skipping post')
                continue
            Post.objects.create(author=author, content=content)
            created += 1
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created {created} sample forum posts'))
        if skipped:
            self.stdout.write(f'  {skipped} forum posts already exist, skipped')

        media_posts = [
            ('John Kavanagh', 'Behind the scenes at SBG Ireland — this is where champions are made. The energy in the gym today was unreal.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80'),
            ('Firas Zahabi', 'Breaking down BJJ techniques with the team at Tristar. Position, pressure, patience — the three Ps of grappling.', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80'),
            ('Javier Mendez', 'Pad work session at AKA. Focus on speed, precision, and footwork. Every rep counts toward fight night.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80'),
            ('Greg Jackson', 'Game planning session with the team. Study the tape, find the patterns, build the strategy. Wins are made in the preparation.', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80'),
            ('Henri Hooft', 'Muay Thai clinch drills at the Blackzilians. Control the neck, control the fight. Working on sweeps and knee combinations.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'),
            ('Rafael Cordeiro', 'Kings MMA striking circuit. Conditioning meets technique. Push the pace, break your limits.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'),
            ('Marcos Parrumpinha', 'American Top Team open mat. High-level sparring with some of the best athletes in the world. Iron sharpens iron.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'),
            ('Duke Roufus', 'Roufusport striking lab. Working on rhythm breaking and feint heavy combinations. Make them guess, then make them pay.', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80'),
            ('SBG Ireland', 'Karibu SBG Nairobi! Our state-of-the-art facility in the heart of Kenya is now open. World-class training for all levels.', 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=800&q=80'),
            ('American Top Team', 'ATT Nairobi facility tour. Over 40,000 sq ft of training space. Wrestling, BJJ, Muay Thai, and boxing — all under one roof in Nairobi.', 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=800&q=80'),
            ('Kings MMA', 'Kings MMA Nairobi gym floor. Morning session with the pro team. The grind never stops in the capital city.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80'),
            ('Xtreme Couture', 'Xtreme Couture Nairobi training facility. Where Kenyan champions are forged. Full sparring and conditioning program available. Sawa sawa!', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'),
        ]

        media_created = 0
        media_skipped = 0
        for author_name, content, img_url in media_posts:
            if Post.objects.filter(content=content).exists():
                media_skipped += 1
                continue
            author = User.objects.filter(display_name=author_name).first()
            if not author:
                author = User.objects.filter(username__startswith=author_name.lower().split()[0]).first()
            if not author:
                self.stdout.write(f'  Author "{author_name}" not found, skipping media post')
                continue
            img_data = _download(img_url)
            post = Post(author=author, content=content)
            if img_data:
                ext = '.jpg'
                for e in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
                    if e in img_url.lower():
                        ext = e
                        break
                post.file.save(f'forum_{author.username}_{media_created}{ext}', ContentFile(img_data), save=False)
            post.save()
            media_created += 1
        if media_created:
            self.stdout.write(self.style.SUCCESS(f'Created {media_created} forum posts with images'))
        if media_skipped:
            self.stdout.write(f'  {media_skipped} media posts already exist, skipped')

        # ------------------------------------------------------------------
        # Seed gallery with community-friendly training photos
        # ------------------------------------------------------------------
        gallery_email = 'gallery@combathub.io'
        gallery_user, created = User.objects.get_or_create(
            email=gallery_email,
            defaults={
                'username': 'combathub_gallery',
                'display_name': 'CombatHub Gallery',
                'role': 'athlete',
                'is_active': True,
            },
        )
        if created:
            gallery_user.set_password('gallery123')
            gallery_user.save()
            self.assign_group_to_user(gallery_user)
        gallery_user.profile.is_premium = True
        gallery_user.profile.bio = 'Official CombatHub gallery — sharing the best training moments from the community.'
        gallery_user.profile.save()

        gallery_images = [
            ('Post-training squad photo. Hard work, bigger smiles. 💪', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'),
            ('Team huddle after an intense sparring session. Together we rise. 🔥', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80'),
            ('Coach and athlete sharing a moment after a tough workout. Respect.', 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80'),
            ('Morning mitt work with the crew. Sweat and smiles all around.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'),
            ('Happy team, strong team. The gym family never quits.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'),
            ('The joy of landing that clean combo in practice. Priceless.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80'),
            ('Training camp vibes at their finest. Every rep counts.', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80'),
            ('Pad work done right. Focus, power, and a smile at the end.', 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=800&q=80'),
            ('Brothers in arms — literally. Gym family forever. 🤜🤛', 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=800&q=80'),
            ('Rest day laughs with the squad. Recovery is part of the grind.', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'),
        ]

        gallery_created = 0
        gallery_skipped = 0
        for caption, img_url in gallery_images:
            if GalleryItem.objects.filter(caption=caption).exists():
                gallery_skipped += 1
                continue
            img_data = _download(img_url)
            item = GalleryItem(user=gallery_user, caption=caption)
            if img_data:
                ext = '.jpg'
                for e in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
                    if e in img_url.lower():
                        ext = e
                        break
                item.image.save(f'gallery_{gallery_created}{ext}', ContentFile(img_data), save=False)
            item.save()
            gallery_created += 1
        if gallery_created:
            self.stdout.write(self.style.SUCCESS(f'Created {gallery_created} gallery items'))
        if gallery_skipped:
            self.stdout.write(f'  {gallery_skipped} gallery items already exist, skipped')
