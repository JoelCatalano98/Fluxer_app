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
  const mergedStyle = {
    minHeight: '100px',
    height: '450px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '0 40px 40px 40px',
    overflow: 'hidden',
    ...style
  };

  const mergedContentStyle = {
    position: 'relative',
    zIndex: 2,
    ...contentStyle
  };

  const mergedTitleStyle = {
    color: 'white',
    textAlign: 'left',
    margin: 0,
    ...titleStyle
  };

  const mergedSubtitleStyle = {
    color: 'rgba(255,255,255,0.8)',
    margin: '5px 0 0 0',
    ...subtitleStyle
  };

  const mergedImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1,
    ...imageStyle
  };

  return (
    <section id={id || undefined} className={className} style={mergedStyle}>
      <div className={contentClassName} style={mergedContentStyle}>
        <h1 id={titleId} className={titleClassName} style={mergedTitleStyle}>{title}</h1>
        {subtitle && <p className={subtitleClassName} style={mergedSubtitleStyle}>{subtitle}</p>}
        {children}
      </div>
      {image && (
        <img
          src={image}
          alt={imageAlt}
          className={imageClassName}
          style={mergedImageStyle}
        />
      )}
    </section>
  );
};

export default PageHeader;
