import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Redactor from './Redactor';
import CropperMain from './CropperMain';
import { $host } from '../../http';

jest.mock('../../http', () => ({ $host: { get: jest.fn(), put: jest.fn() } }));
jest.mock('./CropperMain', () => jest.fn(() => null));
jest.mock('uuid', () => ({ v4: () => 'test-photo' }));
const format = { name: '10x15', width: 10, height: 15, top: 0, bottom: 0, left: 0, right: 0, widthList: 10, heightList: 15 };
beforeEach(() => jest.clearAllMocks());
const currentProps = () => CropperMain.mock.calls[CropperMain.mock.calls.length - 1][0];

test('loads existing format as active', async () => {
    $host.get.mockResolvedValue({ data: [format] });
    render(<Redactor />);
    await waitFor(() => expect(currentProps().activeSettings).toEqual(format));
    expect(currentProps().nameFormat).toBe('10x15');
});

test('empty settings initializes and selects the default format', async () => {
    $host.get.mockResolvedValue({ data: [] });
    $host.put.mockResolvedValue({ data: format });
    render(<Redactor />);
    await waitFor(() => expect($host.put).toHaveBeenCalled());
    await waitFor(() => expect(currentProps().activeSettings).toEqual(expect.objectContaining({ name: '10x15' })));
});
