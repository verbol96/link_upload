import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ModalSettings from './ModalSettings';
import { $host } from '../../http';

jest.mock('../../http', () => ({ $host: { put: jest.fn(), delete: jest.fn() } }));
const format = { id: 1, name: '10x15', width: 10, height: 15, widthList: 10, heightList: 15, top: 0, bottom: 0, left: 0, right: 0, isShow: true };
function Harness() {
    const [settings, setSettings] = useState([{ ...format }]);
    return <ModalSettings settingsDB={settings} setSettingsDB={setSettings} />;
}
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    $host.put.mockResolvedValue({ data: format });
});
afterEach(() => jest.restoreAllMocks());

test('saves a valid edited format through API', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Редактировать'));
    fireEvent.change(screen.getByDisplayValue('10x15'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByTitle('Сохранить'));
    await waitFor(() => expect(screen.queryByTitle('Сохранить')).toBeNull());
    await waitFor(() => expect($host.put).toHaveBeenCalledWith('api/settings/saveFormat', expect.objectContaining({ name: 'Updated' })));
});

test('rejects zero photo width', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Редактировать'));
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '0' } });
    fireEvent.click(screen.getByTitle('Сохранить'));
    expect(window.alert).toHaveBeenCalled();
    expect($host.put).not.toHaveBeenCalled();
});

test('cancel restores the original format values', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Редактировать'));
    fireEvent.change(screen.getByDisplayValue('10x15'), { target: { value: 'Unsaved' } });
    fireEvent.click(screen.getByTitle('Отмена'));
    expect(screen.queryByText('10x15')).not.toBeNull();
    expect(screen.queryByText('Unsaved')).toBeNull();
    expect($host.put).not.toHaveBeenCalled();
});

test('cancelled deletion does not call API', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Редактировать'));
    fireEvent.click(screen.getByTitle('Удалить'));
    expect(window.confirm).toHaveBeenCalled();
    expect($host.delete).not.toHaveBeenCalled();
});

test('rejects negative margins', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByTitle('Редактировать'));
    fireEvent.change(screen.getAllByRole('spinbutton')[2], { target: { value: '-1' } });
    await act(async () => { fireEvent.click(screen.getByTitle('Сохранить')); });
    expect(window.alert).toHaveBeenCalled();
    expect($host.put).not.toHaveBeenCalled();
});
