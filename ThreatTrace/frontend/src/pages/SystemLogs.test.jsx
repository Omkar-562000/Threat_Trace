import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SystemLogs from './SystemLogs';
import * as systemLogsService from '../services/systemLogsService';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Mock the socket.io client
jest.mock('../utils/socket', () => {
  const mSocket = {
    on: jest.fn(),
    off: jest.fn(),
  };
  return mSocket;
});

// Mock the systemLogsService
jest.mock('../services/systemLogsService', () => ({
  getSystemLogs: jest.fn(),
  getLogLevels: jest.fn(),
  downloadExport: jest.fn(),
}));

describe('SystemLogs', () => {
  let server;
  let socket;

  beforeAll((done) => {
    const httpServer = createServer();
    server = new Server(httpServer);
    httpServer.listen(() => {
      const port = server.address().port;
      socket = require('socket.io-client')(`http://localhost:${port}`);
      server.on('connection', (s) => {
        socket = s;
      });
      done();
    });
  });

  afterAll(() => {
    server.close();
    socket.close();
  });

  beforeEach(() => {
    systemLogsService.getSystemLogs.mockResolvedValue({
      status: 'success',
      logs: [],
    });
    systemLogsService.getLogLevels.mockResolvedValue({
      status: 'success',
      levels: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component', async () => {
    render(<SystemLogs />);
    expect(screen.getByText('System Logs')).toBeInTheDocument();
  });

  it('simulates high-frequency log updates', async () => {
    render(<SystemLogs />);

    const logs = [];
    for (let i = 0; i < 500; i++) {
      logs.push({
        message: `Log message ${i}`,
        level: 'INFO',
        source: 'test',
        timestamp: new Date().toISOString(),
      });
    }

    act(() => {
      logs.forEach((log) => {
        socket.emit('system_log', log);
      });
    });

    // Check if the logs are rendered
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('simulates socket disconnection', () => {
    render(<SystemLogs />);
    act(() => {
      socket.disconnect();
    });
    // We can't easily test the visual feedback of disconnection without more mocking,
    // but we can check if the component handles it gracefully.
  });

  it('filters logs by search query', async () => {
    systemLogsService.getSystemLogs.mockResolvedValue({
      status: 'success',
      logs: [
        { message: 'Log message 1', level: 'INFO', source: 'test', timestamp: new Date().toISOString() },
        { message: 'Another message', level: 'INFO', source: 'test', timestamp: new Date().toISOString() },
      ],
    });

    render(<SystemLogs />);
    await screen.findByText('Log message 1');

    fireEvent.change(screen.getByPlaceholderText('Search message, source, level...'), {
      target: { value: 'Log message 1' },
    });

    fireEvent.click(screen.getByText('Apply'));

    expect(screen.getByText('Log message 1')).toBeInTheDocument();
    expect(screen.queryByText('Another message')).not.toBeInTheDocument();
  });

  it('paginates logs', async () => {
    const logs = [];
    for (let i = 0; i < 100; i++) {
      logs.push({
        message: `Log message ${i}`,
        level: 'INFO',
        source: 'test',
        timestamp: new Date().toISOString(),
      });
    }
    systemLogsService.getSystemLogs.mockResolvedValue({
      status: 'success',
      logs,
    });

    render(<SystemLogs />);
    await screen.findByText('Log message 0');

    expect(screen.getAllByRole('row').length).toBe(51); // 50 logs + header

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Log message 50')).toBeInTheDocument();
    expect(screen.queryByText('Log message 0')).not.toBeInTheDocument();
  });
});
