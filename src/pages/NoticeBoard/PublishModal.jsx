import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import 'react-datepicker/dist/react-datepicker.css';
import './PublishModal.scss';

const PublishModal = ({ onConfirm, onClose }) => {
    const [publishType, setPublishType] = useState('now');
    const [scheduledTime, setScheduledTime] = useState(new Date());

    const handleConfirm = () => {
        if (publishType === 'reservation') {
            if (!scheduledTime) {
                Swal.fire({
                    icon: 'warning',
                    title: '예약 시간 누락',
                    text: '예약 시간을 선택해주세요.',
                });
                return;
            }

            if (scheduledTime < new Date()) {
                Swal.fire({
                    icon: 'error',
                    title: '유효하지 않은 시간',
                    text: '현재보다 이후 시간을 선택해주세요.',
                });
                return;
            }
        }

        onConfirm(publishType === 'now' ? null : scheduledTime);
    };

    return (
        <div className="modal-overlay">
            <motion.div
                className="modal-content"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
            >
                <h3>발행 시간 설정</h3>

                <div className="radio-options">
                    <label>
                        <input
                            type="radio"
                            name="publish"
                            value="now"
                            checked={publishType === 'now'}
                            onChange={() => setPublishType('now')}
                        />
                        지금 발행
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="publish"
                            value="reservation"
                            checked={publishType === 'reservation'}
                            onChange={() => setPublishType('reservation')}
                        />
                        예약 발행
                    </label>
                </div>

                {publishType === 'reservation' && (
                    <div className="datepicker-wrapper">
                        <DatePicker
                            selected={scheduledTime}
                            onChange={(date) => setScheduledTime(date)}
                            showTimeSelect
                            dateFormat="yyyy-MM-dd HH:mm"
                            timeFormat="HH:mm"
                            timeIntervals={10}
                            minDate={new Date()}
                            placeholderText="예약 시간 선택"
                            className="custom-datepicker"
                        />
                    </div>
                )}

                <div className="modal-buttons">
                    <button className="confirm" onClick={handleConfirm}>확인</button>
                    <button className="cancel" onClick={onClose}>취소</button>
                </div>
            </motion.div>
        </div>
    );
};

export default PublishModal;
