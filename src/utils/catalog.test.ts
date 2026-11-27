import { describe, expect, it } from 'vitest';
import { findCodigoDuplicado } from './catalog';

const articulos = [{ id: 'a1', codigo: 'ART-01', descripcion: 'Laptop' }];
const servicios = [{ id: 's1', codigo: 'SRV-01', descripcion: 'Mantenimiento' }];

describe('findCodigoDuplicado', () => {
  it('detecta un código repetido en servicios sin importar mayúsculas ni espacios', () => {
    expect(findCodigoDuplicado(' srv-01 ', articulos, servicios)).toEqual({ tipo: 'servicio', descripcion: 'Mantenimiento' });
  });
  it('detecta un código de servicio que ya usa un producto', () => {
    expect(findCodigoDuplicado('ART-01', articulos, servicios)).toEqual({ tipo: 'producto', descripcion: 'Laptop' });
  });
  it('permite guardar el mismo registro que se está editando', () => {
    expect(findCodigoDuplicado('SRV-01', articulos, servicios, 's1')).toBeNull();
  });
  it('permite códigos nuevos', () => {
    expect(findCodigoDuplicado('SRV-02', articulos, servicios)).toBeNull();
  });
});
