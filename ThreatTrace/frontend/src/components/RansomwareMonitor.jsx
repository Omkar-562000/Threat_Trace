import React from 'react';

const RansomwareMonitor = () => {
  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-3">🦠 Ransomware Activity Monitor</h2>
      <p>Real-time detection of ransomware-like behavior based on log analysis.</p>

      <div className="mt-4 bg-gray-800 p-3 rounded">
        <p className="text-gray-300">No active ransomware alerts yet.</p>
      </div>
    </div>
  );
};

export default RansomwareMonitor;
