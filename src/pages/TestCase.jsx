import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Close as CloseIcon } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import { base } from '../config';
import WebSocketManager from '../AuthComponents/useWebSocket';
const API_URL = base(window.env.AP)
const VIDEO_URL = base(window.env.VU)
const WS_URL = base(window.env.WS)

let JOBNAME;

const uuidFromUuidV4 = () => uuid();

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const StyledPaper = styled(Paper)({
  padding: '16px',
  marginBottom: '16px',
  textAlign: 'left',
  color: '#333',
});

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const VisuallyHiddenImageInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const TestCasePage = ({ pathname, navigate }) => {
  const token = sessionStorage.getItem('token');
  const location = useLocation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [ctx, setctx] = useState(JSON.parse(sessionStorage.getItem("user")));
  const { moduleId, JOB, moduleName } = location.state || {};
  const [testCases, setTestCases] = useState([]);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [openModal, setOpenModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBrowser, setSelectedBrowser] = useState('chrome');
  const [gridMode, setGridMode] = useState('on');
  const [message, setMessage] = useState(null);
  const [testCaseList, setTestCaseList] = useState([]);
  const [SeleniumServer, setSeleniumServer] = useState([]);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [selectEnv, setSelectEnv] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [buttonDisableFile, setButtonDisableFile] = useState(false);
  const [buttonDisableImage, setButtonDisableImage] = useState(false);
  const [filePopUp, setFilePopUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setservers] = useState({ id: 1, name: "SQ Brother Server", url: "https://gridview.doingerp.com:443", password: "selenoid" });
  const [error, seterror] = useState('')
  let envvairable = JSON.parse(localStorage.getItem('env'))
  useEffect(() => {
    env = JSON.parse(localStorage.getItem('env'))

    if (env == undefined || env == '') {
      const fetchClients = async () => {
        try {
          const response = await axios.get(`${API_URL}/getbycustomer?user_id=${ctx.id}`, { withCredentials: true });
          const clientsData = [];
          Object.keys(response.data).forEach(clientName => {
            response.data[clientName].forEach(client => {
              clientsData.push({ ...client, clientName });
            });
          });
          setData(clientsData);
          localStorage.setItem("env", JSON.stringify(clientsData))
        } catch (error) {
          console.error("Error fetching clients:", error);
          setData([]);
        }
      };
      fetchClients();
    }
    else {
      setSelectEnv(env);
    }


  }, [moduleId]);

  useEffect(() => {
    const handleWebSocketData = (data) => {
      if (Array.isArray(data) && data[0]?.Modules_id && data[0]?.Test_Case) {
        setTestCases(data);
      }
    };
    WebSocketManager.subscribe(handleWebSocketData);

  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setSearchTerm(event.target.value);
    setCurrentPage(0);
  };

  const filteredTestCases = testCases.filter((testCase) =>
    testCase.Test_Case.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredTestCases.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  const handleCheckboxChange = (event, id) => {
    const isChecked = event.target.checked;
    setSelectedTestCases((prevSelectedTestCases) =>
      isChecked ? [...prevSelectedTestCases, id] : prevSelectedTestCases.filter((testCaseId) => testCaseId !== id)
    );
  };

  const handleRunClick = () => {

    const handleWebSocketData = (data) => {
      if (Array.isArray(data) && data[0]?.name && data[0]?.password) {
        setSeleniumServer(data);
      }
    };
    WebSocketManager.subscribe(handleWebSocketData);
    WebSocketManager.sendMessage({ path: "data", type: "list", table: "server_vnc" });
    const selectedTestCaseNames = paginatedData
      .filter((testCase) => selectedTestCases.includes(testCase.id))
      .map((testCase) => testCase.Test_Case)
      .join(', ');

    setTestCaseList(selectedTestCaseNames ? selectedTestCaseNames.split(', ').map((item) => item.replace(/"/g, '')) : []);
    setButtonDisableFile(false);
    setButtonDisableImage(false);
    setOpenModal(true);
  };

  const handleFileChange = async (event) => {
    if (event.target.files !== undefined) {
      setSelectedFile(event.target.files[0]);
      setButtonDisableFile(true);
      setFilePopUp(true);
      setTimeout(() => {
        setFilePopUp(false);
      }, 1000);
      const file = event.target.files[0];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = 'Test_Data';
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      const filteredData = jsonData.filter((entry) => testCaseList.includes(entry['Test Data']));
      setExcelData(filteredData);
    }
  };

  const handleImageFileChange = (event) => {
    if (event.target.files !== undefined) {
      setSelectedImageFile(event.target.files[0]);
      setButtonDisableImage(true);
      setFilePopUp(true);
    }

    setTimeout(() => {
      setFilePopUp(false);
    }, 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectEnv.map((env) => env.Jenkins_Path)) {
      try {
        const JOB = selectEnv.map((env) => env.Jenkins_Path)
        JOBNAME = JOB[0]
      } catch {
        JOBNAME = selectEnv.map((env) => env.Jenkins_Path)
      }

    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('JobName', JOBNAME);
    formData.append('TestCase', testCaseList.join(','));
    formData.append('GridMode', gridMode);
    formData.append('Browsers', selectedBrowser);
    formData.append('Username', ctx.username)
    formData.append('VIDEO_URL', servers?.url || VIDEO_URL)
    formData.append('API', API_URL)
    formData.append('websocket', WS_URL)
    formData.append('Token', token);

    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    if (selectedImageFile) {
      formData.append('image', selectedImageFile);
    }

    try {
      const response = await fetch(`${API_URL}/build`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Test cases are running', severity: 'success' });
        const result = await response.json();
        const handleWebSocketData = (data) => {
          if (data.path === "chat" && data?.token === token && data?.hasOwnProperty('browserId')) {
            sessionStorage.setItem('excelData', JSON.stringify(excelData));
            sessionStorage.setItem('browsers_id', JSON.stringify([data]));
            setIsLoading(false);
            setMessage('Success');
            navigate('/progress', { excelData, servers });

          }
        };

        WebSocketManager.subscribe(handleWebSocketData);


      } else {
        console.error('Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };


  const handleCloseModal = () => {
    setButtonDisableFile(false);
    setButtonDisableImage(false);
    setOpenModal(false);
  };

  const Filepopup = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#393E46',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      animation: 'fadeInOut 6s ease-in-out'
    }}>
      <span>File Selected Successfully</span>
    </div>
  );

  return (
    <Container>
      <StyledPaper>
        <Grid container spacing={{ xs: 1, md: 1 }} sx={{ alignItems: "basecine" }} columns={{ xs: 4, sm: 4, md: 4 }}>

          <Grid size={4} sx={{
            alignItems: "center",
            display: "inline-flex",
            justifyContent: "flex-end",
            alignItems: "stretch",
            height: "53px",
          }}>

            <Button
              // style={{ fontSize: '0.7em' }}
              title="Please download the test data file before running the test cases"
              fullWidth
              variant="contained"
              color="primary"
              href=
              {`https://oracle.doingerp.com/api/samplefile?path=/job/${envvairable[0].Jenkins_Path.split('/').slice(0, -1).join('/job/')}/job/Test_Data_${moduleName.replace(' ', '_')}`}

              sx={{ margin: "3px", maxWidth: '240px', backgroundColor: '#393E46', '&:hover': { backgroundColor: '#00ADB5' } }}
            >
              1. Download Test Data
            </Button>
            <Button
              title='Please select the test cases to run'
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleRunClick}
              disabled={selectedTestCases.length === 0}
              sx={{ margin: "3px", maxWidth: '100px', backgroundColor: '#393E46', '&:hover': { backgroundColor: '#00ADB5' } }}
            >
              2. Run
            </Button>
            <TextField
              title='Search for test cases'
              style={{ marginTop: "0px" }}
              label="Search Test Cases"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              fullWidth
            />
          </Grid>


          <Grid size={{ xs: 4, sm: 4, md: 4 }}>
            <TableContainer sx={{ maxHeight: 500 }} component={Paper}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead >
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedTestCases.length > 0 &&
                          selectedTestCases.length < testCases.length
                        }
                        checked={testCases.length > 0 && selectedTestCases.length === testCases.length}
                        onChange={(event) =>
                          setSelectedTestCases(
                            event.target.checked ? testCases.map((testCase) => testCase.id) : []
                          )
                        }
                        inputProps={{ 'aria-label': 'select all test cases' }}
                      />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Test Case</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((testCase) => (
                    <TableRow hover tabIndex={-1} key={testCase.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedTestCases.includes(testCase.id)}
                          onChange={(event) => handleCheckboxChange(event, testCase.id)}
                          inputProps={{ 'aria-label': `select test case ${testCase.id}` }}
                        />
                      </TableCell>
                      <TableCell>{testCase.id}</TableCell>
                      <TableCell>{testCase.Test_Case}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredTestCases.length}
              rowsPerPage={rowsPerPage}
              page={currentPage}
              onPageChange={(_, newPage) => setCurrentPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setCurrentPage(0);
              }}
            />
          </Grid>

        </Grid>
      </StyledPaper>
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          component="form"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}
          onSubmit={handleSubmit}
        >

          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Grid container spacing={{ xs: 1, md: 1 }} sx={{ alignItems: "basecine" }} columns={{ xs: 4, sm: 4, md: 4 }}>
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              {filePopUp && <Filepopup />}
              <Typography variant="h6" component="h2" gutterBottom>
                Run Configuration
              </Typography>
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <TextField
                label="Test Case"
                value={testCaseList.join(',')}
                fullWidth
                disabled
              />
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Selenium Server</InputLabel>
                <Select value={servers?.id || ""} renderValue={() => servers?.name || ""} onChange={(e) => setservers(SeleniumServer.find((s) => s.id === e.target.value))}>
                  {SeleniumServer.map((server) =>
                    <MenuItem key={server.id} value={server.id}>{server.name}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>Browser</InputLabel>
                <Select value={selectedBrowser} onChange={(e) => setSelectedBrowser(e.target.value)}>
                  <MenuItem value="chrome">Chrome</MenuItem>
                  <MenuItem value="firefox">Firefox</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel sx={{ paddingBottom: '5%' }}>Grid Mode</InputLabel>
                <Select value={gridMode} onChange={(e) => setGridMode(e.target.value)}>
                  <MenuItem value="on">On</MenuItem>
                  <MenuItem value="off">Off</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ backgroundColor: '#393E46', '&:hover': { backgroundColor: '#00ADB5' } }}
              >
                Upload Test Data
                <VisuallyHiddenInput type="file" accept=".xlsx, .xls,.xlsm" onChange={handleFileChange} />
              </Button>
              {selectedFile && <Typography variant="caption">{selectedFile.name}</Typography>}
            </Grid>
            {/* <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ backgroundColor: '#393E46', '&:hover': { backgroundColor: '#00ADB5' } }}
              >
                Upload Image
                <VisuallyHiddenImageInput type="file" accept="image/*" onChange={handleImageFileChange} />
              </Button>
              {selectedImageFile && <Typography variant="caption">{selectedImageFile.name}</Typography>}
            </Grid> */}
            <Grid size={{ xs: 4, sm: 4, md: 4 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                sx={{ backgroundColor: '#393E46', '&:hover': { backgroundColor: '#00ADB5' } }}
              >
                Submit
              </Button>
            </Grid>
            {isLoading && (
              <Grid size={{ xs: 4, sm: 4, md: 4 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                <CircularProgress />
              </Grid>
            )}
            {message && (
              <Grid size={{ xs: 4, sm: 4, md: 4 }}>
                <Typography variant="body2" color="success.main">
                  {message}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Modal>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestCasePage;
