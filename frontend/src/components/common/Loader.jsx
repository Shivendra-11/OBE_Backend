import './Loader.css';

const Loader = ({ size = 'medium', text = '' }) => {
  return (
    <div className="loader-container">
      <div className={`loader loader-${size}`}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
