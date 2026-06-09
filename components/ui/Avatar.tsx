// Auto-generates a unique avatar per user via DiceBear when no photo is uploaded.
// Usage: <Avatar userId={id} avatarUrl={profile.avatar_url} name={profile.display_name} size={32} />

type AvatarProps = {
  userId: string;
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export default function Avatar({ userId, avatarUrl, name, size = 32, className = '' }: AvatarProps) {
  const src = avatarUrl ?? `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(userId)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  return (
    <img
      src={src}
      alt={name ?? 'Avatar'}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-zinc-100 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
