// src/components/Toggle.jsx
import React from 'react';
import './Toggle.css'; // <-- ยืนยันว่า import ไฟล์นี้

const Toggle = ({ isChecked, handleChange, className = '', id = 'theme-toggle' }) => {
  return (
    <div className={`theme-toggle-container ${className}`}>
      <input
        type="checkbox"
        id={id}
        className="theme-toggle-checkbox"
        checked={isChecked}
        onChange={handleChange}
      />
      <label htmlFor={id} className="theme-toggle-label">
        {/* โค้ดสำหรับ Day Mode */}
        <span className="mode-text day-mode-text">DAY</span>
        <span className="mode-icon sun-icon">&#9728;</span>

        {/* โค้ดสำหรับ Night Mode (จะแสดงเมื่อสลับ) */}
        <span className="mode-text night-mode-text">NIGHT</span>
        <span className="mode-icon moon-icon">&#9789;</span>
      </label>
    </div>
  );
};

export default Toggle;