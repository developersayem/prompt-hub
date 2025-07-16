const LoadingCom: React.FC<{ displayText?: string }> = ({
  displayText = "Loading...",
}) => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">{displayText}</span>
    </div>
  );
};

export default LoadingCom;
