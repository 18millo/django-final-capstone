from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Profile, UsernameChange, SiteContent, VendorAccessCode, Post, PostComment, PostLike, GalleryItem, GalleryLike, GalleryComment, Bookmark, Report, BlockedUser, PostCommentLike, ContentFlag, IPLog, PaymentInfo, PhoneVerificationCode, Group, GroupMember, GroupMessage, Notification, Follow, Message, EmailVerificationCode


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'display_name', 'avatar_preview', 'role', 'is_premium', 'messaging_blocked', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'profile__is_premium', 'messaging_blocked')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'display_name', 'role', 'google_id')}),
        ('2FA', {'fields': ('totp_secret', 'totp_enabled'), 'classes': ('collapse',)}),
        ('Moderation', {'fields': ('messaging_blocked',), 'classes': ('collapse',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    search_fields = ('email', 'username', 'display_name')
    ordering = ('email',)

    def is_premium(self, obj):
        return obj.profile.is_premium
    is_premium.boolean = True
    is_premium.short_description = 'Premium'
    is_premium.admin_order_field = 'profile__is_premium'

    def avatar_preview(self, obj):
        if obj.profile and obj.profile.avatar:
            return format_html('<img src="{}" width="40" height="40" style="object-fit:cover;border-radius:50%" />', obj.profile.avatar.url)
        return ''
    avatar_preview.short_description = 'Avatar'


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('avatar_preview', 'user', 'vendor_access_code', 'weight_class', 'stance', 'phone', 'is_premium', 'messaging_enabled')
    list_filter = ('is_premium', 'weight_class', 'stance')
    search_fields = ('user__email', 'business_name', 'vendor_access_code')
    list_editable = ('is_premium',)
    readonly_fields = ('avatar_preview', 'vendor_access_code')

    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;border-radius:8px" />', obj.avatar.url)
        return ''
    avatar_preview.short_description = 'Avatar'


@admin.register(UsernameChange)
class UsernameChangeAdmin(admin.ModelAdmin):
    list_display = ('user', 'old_username', 'new_username', 'changed_at')
    list_filter = ('changed_at',)


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ('key', 'title', 'updated_at')
    search_fields = ('key', 'title')


@admin.register(VendorAccessCode)
class VendorAccessCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'role', 'description', 'is_active', 'used_by', 'created_at')
    list_filter = ('is_active', 'role')
    search_fields = ('code', 'description')
    list_editable = ('is_active', 'role')


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_preview', 'author', 'short_content', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('author__email', 'content')
    readonly_fields = ('file_preview',)

    def short_content(self, obj):
        return obj.content[:60] + ('...' if len(obj.content) > 60 else '')
    short_content.short_description = 'Content'

    def file_preview(self, obj):
        if obj.file:
            url = obj.file.url
            ext = url.lower().rsplit('.', 1)[-1] if '.' in url else ''
            if ext in ('jpg', 'jpeg', 'png', 'gif', 'webp'):
                return format_html('<img src="{}" width="80" height="60" style="object-fit:cover;border-radius:6px" />', url)
            return format_html('<a href="{}" target="_blank">View file</a>', url)
        return ''
    file_preview.short_description = 'File'


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'post', 'short_content', 'created_at')
    list_filter = ('created_at',)

    def short_content(self, obj):
        return obj.content[:60] + ('...' if len(obj.content) > 60 else '')
    short_content.short_description = 'Content'


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'vote_type', 'created_at')


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'image_preview', 'short_caption', 'like_count', 'comment_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'caption')
    readonly_fields = ('image_preview', 'like_count', 'comment_count')

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;border-radius:8px" />', obj.image.url)
        return ''
    image_preview.short_description = 'Image'

    def short_caption(self, obj):
        return obj.caption[:60] + ('...' if len(obj.caption) > 60 else '')
    short_caption.short_description = 'Caption'

    def like_count(self, obj):
        return obj.likes.count()
    like_count.short_description = 'Likes'

    def comment_count(self, obj):
        return obj.comments.count()
    comment_count.short_description = 'Comments'


@admin.register(GalleryLike)
class GalleryLikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'gallery_item', 'vote_type', 'created_at')
    list_filter = ('created_at',)


@admin.register(GalleryComment)
class GalleryCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'gallery_item', 'short_content', 'created_at')
    list_filter = ('created_at',)

    def short_content(self, obj):
        return obj.content[:60] + ('...' if len(obj.content) > 60 else '')
    short_content.short_description = 'Content'


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'reporter', 'reason', 'status', 'created_at')
    list_filter = ('reason', 'status')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'actor', 'notification_type', 'message_short', 'read', 'created_at')
    list_filter = ('notification_type', 'read', 'created_at')
    search_fields = ('recipient__email', 'actor__email', 'message')
    list_editable = ('read',)

    def message_short(self, obj):
        return obj.message[:60] + ('...' if len(obj.message) > 60 else '')
    message_short.short_description = 'Message'


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'blocker', 'blocked', 'created_at')


@admin.register(PostCommentLike)
class PostCommentLikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'comment', 'vote_type', 'created_at')


@admin.register(ContentFlag)
class ContentFlagAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'content_type', 'reason', 'status', 'created_at')
    list_filter = ('reason', 'status', 'content_type')
    search_fields = ('user__email',)


@admin.register(IPLog)
class IPLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'action', 'ip_short', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__email',)

    def ip_short(self, obj):
        return obj.ip_hash[:16] + '...'
    ip_short.short_description = 'IP Hash'


@admin.register(PaymentInfo)
class PaymentInfoAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'method', 'mpesa_phone', 'card_last_four', 'created_at')
    list_filter = ('method', 'created_at')
    search_fields = ('user__email', 'mpesa_phone')


@admin.register(PhoneVerificationCode)
class PhoneVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'code', 'is_used', 'created_at')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'phone')


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower', 'following', 'created_at')
    search_fields = ('follower__email', 'following__email')
    list_filter = ('created_at',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'recipient', 'short_content', 'read', 'view_once', 'created_at')
    list_filter = ('read', 'view_once', 'created_at')
    search_fields = ('sender__email', 'recipient__email')

    def short_content(self, obj):
        return (obj.content or '')[:60] + ('...' if len(obj.content or '') > 60 else '')
    short_content.short_description = 'Content'


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'code', 'type', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'type', 'created_at')
    search_fields = ('user__email',)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'is_private', 'member_count', 'created_at')
    list_filter = ('is_private',)
    search_fields = ('name', 'created_by__email')

    def member_count(self, obj):
        return obj.members.filter(status='joined').count()
    member_count.short_description = 'Members'


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'group', 'role', 'status', 'joined_at')
    list_filter = ('role', 'status')


@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'group', 'short_content', 'has_image', 'created_at')
    list_filter = ('group',)

    def short_content(self, obj):
        return obj.content[:40] + ('...' if len(obj.content) > 40 else '')
    short_content.short_description = 'Content'

    def has_image(self, obj):
        return bool(obj.image)
    has_image.boolean = True
    has_image.short_description = 'Image'
