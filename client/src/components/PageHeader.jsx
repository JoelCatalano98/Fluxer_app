const PageHeader = ({
  title,
  subtitle,
  image,
  children,
  id = 'content-header',
  className = 'dashboard-header',
  style,
  contentClassName = 'header-overlay',
  contentStyle,
  titleId,
  titleClassName = 'header-title',
  titleStyle,
  subtitleClassName = 'header-subtitle',
  subtitleStyle,
  imageClassName = 'header-bg-img',
  imageStyle,
  imageAlt = 'Fondo',
}) => {
  return (
    <section id={id || undefined} className={className} style={style}>
      <div className={contentClassName} style={contentStyle}>
        <h1 id={titleId} className={titleClassName} style={titleStyle}>{title}</h1>
        {subtitle && <p className={subtitleClassName} style={subtitleStyle}>{subtitle}</p>}
        {children}
      </div>
      {image && (
        <img
          src={image}
          alt={imageAlt}
          className={imageClassName}
          style={imageStyle}
        />
      )}
    </section>
  );
};

export default PageHeader;
