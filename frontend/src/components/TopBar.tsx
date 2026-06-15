// src/components/TopBar.tsx
import { useStore } from '../store/useStore';
import { FaBell, FaSyncAlt, FaUserCircle } from 'react-icons/fa';

const TopBar: React.FC = () => {
  const { sync } = useStore();
  return (
    <header className="flex items-center justify-between bg-white bg-opacity-80 backdrop-blur-md p-4 shadow-md glass">
      <h1 className="text-2xl font-semibold text-secondary">District Health Command Center</h1>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <FaBell className="text-xl text-primary" />
          {/* badge placeholder */}
          <span className="absolute -top-1 -right-1 inline-block h-2 w-2 bg-danger rounded-full" />
        </div>
        <div className="flex items-center space-x-1">
          <FaSyncAlt className={`text-xl ${sync.offline ? 'text-gray-400' : 'text-success'}`} />
          <span className="text-sm text-gray-700">{sync.offline ? 'Offline' : 'Online'}</span>
        </div>
        <FaUserCircle className="text-2xl text-primary" />
      </div>
    </header>
  );
};

export default TopBar;
