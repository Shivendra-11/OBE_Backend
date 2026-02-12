import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './ProgramOutcomes.css';

const ProgramOutcomes = () => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form State
  const [newPO, setNewPO] = useState({
    code: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.listPOs();
      setPos(data);
    } catch (error) {
      console.error('Error fetching POs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewPO({ ...newPO, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await adminAPI.createPO(newPO);
      setIsModalOpen(false);
      setNewPO({ code: '', description: '' });
      fetchPOs(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create PO');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Program Outcomes (POs)</h1>
          <p>Define the program outcomes for the curriculum</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon="+" variant="primary">
          Add PO
        </Button>
      </div>

      {loading ? (
        <Loader size="large" text="Loading POs..." />
      ) : (
        <Card className="po-list-card">
          <div className="table-responsive">
            <table className="po-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: '150px' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {pos.length > 0 ? (
                  pos.map((po) => (
                    <tr key={po._id}>
                      <td>
                        <span className="po-badge">{po.code}</span>
                      </td>
                      <td>
                        <p className="po-description">{po.description}</p>
                      </td>
                      <td className="text-secondary text-sm">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      No Program Outcomes defined yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create PO Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Program Outcome"
      >
        <form onSubmit={handleCreatePO} className="create-po-form">
          {error && <div className="form-error">{error}</div>}
          
          <Input
            label="PO Code"
            name="code"
            value={newPO.code}
            onChange={handleInputChange}
            placeholder="e.g. PO1"
            required
            autoFocus
          />
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={newPO.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Enter the description of the Program Outcome..."
              rows="4"
              required
            />
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createLoading}>
              Create PO
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProgramOutcomes;
