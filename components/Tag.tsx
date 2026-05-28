interface TagProps {
  children: React.ReactNode;
  solid?: boolean;
  style?: React.CSSProperties;
}

export default function Tag({ children, solid, style }: TagProps) {
  return (
    <span className={`chip${solid ? ' solid' : ''}`} style={style}>
      {children}
    </span>
  );
}
