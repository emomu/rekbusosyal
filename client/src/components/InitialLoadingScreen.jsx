import React from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';

const InitialLoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-60 h-60">
        <Lottie animationData={loaderAnimation} loop={true} />
      </div>
    </div>
  );
};

export default InitialLoadingScreen;
