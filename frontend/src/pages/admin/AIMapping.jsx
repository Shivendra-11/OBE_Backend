import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import './AIMapping.css';

const PO_LABELS = [
  'PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6',
  'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'
];

const PO_SHORT_NAMES = {
  PO1: 'Engineering Knowledge',
  PO2: 'Problem Analysis',
  PO3: 'Design/Development',
  PO4: 'Investigations',
  PO5: 'Modern Tools',
  PO6: 'Engineer & Society',
  PO7: 'Environment',
  PO8: 'Ethics',
  PO9: 'Teamwork',
  PO10: 'Communication',
  PO11: 'Project Management',
  PO12: 'Life-Long Learning',
};

const AIMapping = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dbCOs, setDbCOs] = useState([]); // Store full CO objects from DB
  const [coInputs, setCoInputs] = useState([]);
  const [mapping, setMapping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await adminAPI.listCourses();
      setCourses(data);
    } catch (err) {
      setError('Failed to fetch courses. Please refresh.');
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setMapping(null);
    setSuccess('');
    setError('');

    if (!courseId) {
      setDbCOs([]);
      setCoInputs([]);
      return;
    }

    setLoading(true);
    try {
      const [cos, existingMappings] = await Promise.all([
        adminAPI.listCOs(courseId),
        adminAPI.listMappings(courseId)
      ]);

      if (cos && cos.length > 0) {
        const sortedCos = [...cos].sort((a, b) => a.number - b.number);
        setDbCOs(sortedCos);
        setCoInputs(sortedCos.map(co => co.description));
        
        // Populate existing mappings into the table structure
        if (existingMappings && existingMappings.length > 0) {
          const mappingObj = {};
          existingMappings.forEach(m => {
            const coKey = `CO${m.CO}`; // AI tool uses CO1, CO2... keys
            if (!mappingObj[coKey]) mappingObj[coKey] = {};
            mappingObj[coKey][m.PO] = m.level;
          });
          setMapping(mappingObj);
        } else {
          setMapping(null);
        }
      } else {
        setDbCOs([]);
        setCoInputs([]);
        setError('No Course Outcomes found for this subject. Please add them first.');
      }
    } catch (err) {
      setError('Failed to fetch Course Outcomes.');
      setDbCOs([]);
      setCoInputs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setDbCOs([]);
    setCoInputs([]);
    setMapping(null);
    setSelectedCourse('');
    setError('');
    setSuccess('');
  };

  const handleGenerate = async () => {
    const validCODescriptions = coInputs.map(co => co.trim()).filter(co => co.length > 0);

    if (validCODescriptions.length === 0) {
      setError('Please enter at least one Course Outcome.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setMapping(null);

    try {
      const result = await adminAPI.generateAIMapping(validCODescriptions);
      setMapping(result.mapping);
    } catch (err) {
      const serverError = err.response?.data?.error;
      const mainMessage = err.response?.data?.message || 'Failed to generate mapping.';
      setError(serverError ? `${mainMessage} Details: ${serverError}` : mainMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!selectedCourse || !mapping) return;

    setSaveLoading(true);
    setError('');
    setSuccess('');

    try {
      const course = courses.find(c => c._id === selectedCourse);
      const mappingsToSave = [];

      Object.entries(mapping).forEach(([coKey, poMapping]) => {
        // coKey looks like "CO1", "CO2"...
        // We need to find the corresponding database CO number
        const coIndex = parseInt(coKey.replace('CO', '')) - 1;
        const coObject = dbCOs[coIndex];
        
        if (coObject) {
          Object.entries(poMapping).forEach(([poCode, level]) => {
            // Only save if level is 1, 2, or 3 (some AI might return null or 0)
            if (level && level > 0) {
              mappingsToSave.push({
                CO: coObject.number, // The real number e.g. 1, 2, 3 OR 101, 102...
                PO: poCode,
                level: Number(level)
              });
            }
          });
        }
      });

      console.log("Saving Mappings to DB:", mappingsToSave);
      await adminAPI.mapCOPOBulk(selectedCourse, course.code, mappingsToSave);
      setSuccess(
        <span>
          AI-generated mapping successfully saved! 
          <a href="/admin/co-po-mapping" style={{ marginLeft: '10px', color: '#fff', textDecoration: 'underline' }}>
            View in CO-PO Mapping Section →
          </a>
        </span>
      );
    } catch (err) {
      console.error("Save Error:", err);
      setError(err.response?.data?.message || 'Failed to save mapping to database.');
    } finally {
      setSaveLoading(false);
    }
  };

  const getCellClass = (level) => {
    if (level === 3) return 'cell-high';
    if (level === 2) return 'cell-medium';
    if (level === 1) return 'cell-low';
    return 'cell-empty';
  };

  const handleCellClick = (coKey, poCode) => {
    if (!mapping || !mapping[coKey]) return;

    const currentLevel = mapping[coKey][poCode] ?? null;
    let nextLevel;

    // Cycle: null -> 1 -> 2 -> 3 -> null
    if (currentLevel === null) nextLevel = 1;
    else if (currentLevel === 1) nextLevel = 2;
    else if (currentLevel === 2) nextLevel = 3;
    else nextLevel = null;

    setMapping({
      ...mapping,
      [coKey]: {
        ...mapping[coKey],
        [poCode]: nextLevel
      }
    });

    setSuccess(''); // Clear success message if they modify
  };

  const coKeys = mapping ? Object.keys(mapping).sort((a, b) => {
    const numA = parseInt(a.replace('CO', ''));
    const numB = parseInt(b.replace('CO', ''));
    return numA - numB;
  }) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>🤖 AI CO-PO Mapping</h1>
          <p>Generate CO-PO mapping using Gemini AI based on AKTU Program Outcomes</p>
        </div>
      </div>

      {/* Select Course Section */}
      <Card className="course-select-card mb-6">
        <div className="select-group">
          <label htmlFor="course-select" className="select-label">Select Subject</label>
          <select 
            id="course-select"
            className="course-select-dropdown"
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            <option value="">-- Select a Course --</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* CO Display Section */}
      <Card className="ai-input-card mb-6">
        <h3 className="section-title">Course Outcomes</h3>
        <p className="section-subtitle">
          {selectedCourse 
            ? "Course Outcomes defined for this subject. AI will generate mapping for these COs."
            : "Select a subject above to load its Course Outcomes."}
        </p>

        <div className="co-inputs-list">
          {!selectedCourse ? (
            <div className="text-secondary text-center py-4">
              Please select a course to see COs
            </div>
          ) : coInputs.length === 0 ? (
            <div className="alert alert-warning">
              No Course Outcomes found for this subject. Please add them in the <strong>Course Outcome</strong> section first.
            </div>
          ) : (
            coInputs.map((co, index) => (
              <div key={index} className="co-display-row">
                <span className="co-label">
                  CO{dbCOs[index]?.number || index + 1}
                </span>
                <div className="co-description-box">
                  {co}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="co-actions">
          <div className="left-actions">
            <Button onClick={handleClearAll} variant="outline" size="small" icon="🧹">
              Reset Selection
            </Button>
          </div>
          <Button
            onClick={handleGenerate}
            variant="primary"
            size="large"
            loading={loading}
            icon="🚀"
            disabled={!selectedCourse || coInputs.length === 0}
          >
            Generate AI Mapping
          </Button>
        </div>
      </Card>

      {/* Error & Success Messages */}
      {error && <div className="alert alert-danger mb-4 show-animation">{error}</div>}
      {success && <div className="alert alert-success mb-4 show-animation">{success}</div>}

      {/* Loading */}
      {loading && (
        <div className="ai-loading-container">
          <Loader size="large" text="Gemini AI is analyzing your Course Outcomes..." />
          <p className="ai-loading-hint">This may take a few seconds</p>
        </div>
      )}

      {/* Results Table */}
      {mapping && !loading && (
        <Card className="ai-result-card">
          <div className="result-header">
            <div>
              <h3 className="section-title">Generated CO-PO Mapping Matrix</h3>
              <p className="section-subtitle-small">💡 Tip: Click any cell to manually cycle mapping levels (1 → 2 → 3 → null)</p>
            </div>
            <Button 
               variant="success" 
               onClick={handleSaveMapping} 
               loading={saveLoading}
               icon="💾"
               disabled={!selectedCourse}
               title={!selectedCourse ? "Select a course to save" : ""}
            >
              Save to Database
            </Button>
          </div>

          <div className="table-responsive glass-panel mt-4">
            <table className="ai-matrix-table">
              <thead>
                <tr>
                  <th className="sticky-col">CO / PO</th>
                  {PO_LABELS.map(po => (
                    <th key={po} title={PO_SHORT_NAMES[po]}>
                      <div className="po-header">
                        <span className="po-code">{po}</span>
                        <span className="po-name">{PO_SHORT_NAMES[po]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coKeys.map((coKey) => (
                  <tr key={coKey}>
                    <td className="sticky-col font-bold co-row-label">
                      <span>{coKey}</span>
                    </td>
                    {PO_LABELS.map(po => {
                      const level = mapping[coKey]?.[po] ?? null;
                      return (
                        <td 
                          key={po} 
                          className={`text-center cell-interactive ${getCellClass(level)}`}
                          onClick={() => handleCellClick(coKey, po)}
                          title="Click to cycle LEVEL: null -> 1 -> 2 -> 3"
                        >
                          {level !== null ? level : <span className="text-muted">null</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="ai-legend mt-4">
            <span><strong>Legend:</strong></span>
            <span className="badge cell-empty">— No Correlation</span>
            <span className="badge cell-low">1 — Low</span>
            <span className="badge cell-medium">2 — Medium</span>
            <span className="badge cell-high">3 — High</span>
          </div>

          {/* CO Descriptions Reference */}
          <div className="co-reference mt-4">
            <h4>Course Outcomes Reference</h4>
            <ul>
              {coKeys.map((coKey, i) => {
                const coIndex = parseInt(coKey.replace('CO', '')) - 1;
                const coNum = dbCOs[coIndex]?.number || (i + 1);
                return (
                  <li key={coKey}>
                    <strong>CO{coNum}:</strong> {coInputs[coIndex] || '—'}
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIMapping;
