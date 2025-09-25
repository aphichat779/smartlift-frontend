// src/components/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        rp_id: null,
        org_id: '',
        building_id: '',
        lift_id: '',
        detail: '',
        date_rp: ''
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await apiService.getReports();
            if (response.success) {
                setReports(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch reports.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (formData.rp_id) {
                response = await apiService.updateReport(formData);
            } else {
                response = await apiService.createReport(formData);
            }

            if (response.success) {
                alert(response.message);
                setFormData({
                    rp_id: null,
                    org_id: '',
                    building_id: '',
                    lift_id: '',
                    detail: '',
                    date_rp: ''
                });
                fetchReports(); // อัปเดตรายการใหม่
            } else {
                alert(response.message);
            }
        } catch (err) {
            alert('An error occurred. Please check the console.');
            console.error(err);
        }
    };

    const handleEdit = (report) => {
        setFormData({
            rp_id: report.rp_id,
            org_id: report.org_id,
            building_id: report.building_id,
            lift_id: report.lift_id,
            detail: report.detail,
            date_rp: report.date_rp
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                const response = await apiService.deleteReport(id);
                if (response.success) {
                    alert(response.message);
                    fetchReports();
                } else {
                    alert(response.message);
                }
            } catch (err) {
                alert('An error occurred. Please check the console.');
                console.error(err);
            }
        }
    };

    if (loading) return <div>Loading reports...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Reports Management</h1>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <input
                    type="date"
                    name="date_rp"
                    value={formData.date_rp}
                    onChange={handleChange}
                    style={{ margin: '5px' }}
                />
                <input
                    type="number"
                    name="org_id"
                    placeholder="Organization ID"
                    value={formData.org_id}
                    onChange={handleChange}
                    style={{ margin: '5px' }}
                    required
                />
                <input
                    type="number"
                    name="building_id"
                    placeholder="Building ID"
                    value={formData.building_id}
                    onChange={handleChange}
                    style={{ margin: '5px' }}
                    required
                />
                <input
                    type="number"
                    name="lift_id"
                    placeholder="Lift ID"
                    value={formData.lift_id}
                    onChange={handleChange}
                    style={{ margin: '5px' }}
                    required
                />
                <textarea
                    name="detail"
                    placeholder="Detail"
                    value={formData.detail}
                    onChange={handleChange}
                    style={{ margin: '5px', width: '300px' }}
                    required
                />
                <button type="submit" style={{ margin: '5px' }}>
                    {formData.rp_id ? 'Update Report' : 'Add Report'}
                </button>
            </form>

            <h2>Reports List</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Reporter</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Organization</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Building</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Lift</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Detail</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report) => (
                        <tr key={report.rp_id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{report.date_rp}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{report.reporter_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{report.org_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{report.building_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{report.lift_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{report.detail}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                <button onClick={() => handleEdit(report)} style={{ marginRight: '5px' }}>Edit</button>
                                <button onClick={() => handleDelete(report.rp_id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Reports;