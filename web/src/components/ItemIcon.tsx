interface Props {
  name: string;
  iconUrl: string | null;
  quality: string | null;
  size?: number;
}

/** Item icon with a border in the item's quality color. Falls back to the first letter. */
export function ItemIcon({ name, iconUrl, quality, size = 36 }: Props) {
  const className = `item-icon quality-border-${(quality ?? "common").toLowerCase()}`;
  const style = { width: size, height: size };

  if (iconUrl) {
    return <img className={className} style={style} src={iconUrl} alt="" loading="lazy" />;
  }
  return (
    <span className={`${className} item-icon-fallback`} style={style} aria-hidden="true">
      {name.charAt(0)}
    </span>
  );
}

export function qualityClass(quality: string | null): string {
  return `quality-${(quality ?? "common").toLowerCase()}`;
}
