/**
 * Tests unitarios para servicio de protocolos terapéuticos
 * 
 * @author AntoApp Team
 */

import therapeuticProtocolService from '../../../services/therapeuticProtocolService.js';

describe('TherapeuticProtocolService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método startProtocol', () => {
      expect(typeof therapeuticProtocolService.startProtocol).toBe('function');
    });

    it('debe tener método getActiveProtocol', () => {
      expect(typeof therapeuticProtocolService.getActiveProtocol).toBe('function');
    });

    it('debe tener método advanceProtocol', () => {
      expect(typeof therapeuticProtocolService.advanceProtocol).toBe('function');
    });

    it('debe tener método getCurrentIntervention', () => {
      expect(typeof therapeuticProtocolService.getCurrentIntervention).toBe('function');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe iniciar protocolo válido', () => {
      const protocol = therapeuticProtocolService.startProtocol('user123', 'panic_protocol');
      
      expect(protocol).toBeDefined();
      expect(protocol).toHaveProperty('protocolName');
      expect(protocol).toHaveProperty('currentStep');
      expect(protocol).toHaveProperty('steps');
    });

    it('debe retornar null para protocolo inexistente', () => {
      const protocol = therapeuticProtocolService.startProtocol('user123', 'nonexistent');
      
      expect(protocol).toBeNull();
    });

    it('debe obtener protocolo activo', () => {
      therapeuticProtocolService.startProtocol('user123', 'panic_protocol');
      const active = therapeuticProtocolService.getActiveProtocol('user123');
      
      expect(active).toBeDefined();
      expect(active).toHaveProperty('protocolName');
    });

    it('debe retornar null para usuario sin protocolo activo', () => {
      const active = therapeuticProtocolService.getActiveProtocol('user456');
      
      expect(active).toBeNull();
    });

    it('debe avanzar protocolo correctamente', () => {
      therapeuticProtocolService.startProtocol('user789', 'panic_protocol');
      const advanced = therapeuticProtocolService.advanceProtocol('user789');
      
      expect(advanced).toBeDefined();
      expect(advanced).toHaveProperty('step');
      expect(advanced.step).toBe(2);
      
      // Verificar que el protocolo activo tiene el paso actualizado
      const active = therapeuticProtocolService.getActiveProtocol('user789');
      expect(active.currentStep).toBe(2);
    });

    it('debe retornar null al avanzar protocolo inexistente', () => {
      const advanced = therapeuticProtocolService.advanceProtocol('user999');
      
      expect(advanced).toBeNull();
    });

    it('debe obtener intervención actual', () => {
      therapeuticProtocolService.startProtocol('user111', 'panic_protocol');
      const intervention = therapeuticProtocolService.getCurrentIntervention('user111');
      
      expect(intervention).toBeDefined();
      expect(intervention).toHaveProperty('step');
      expect(intervention).toHaveProperty('intervention');
    });

    it('debe retornar null para intervención de usuario sin protocolo', () => {
      const intervention = therapeuticProtocolService.getCurrentIntervention('user222');
      
      expect(intervention).toBeNull();
    });

    it('debe finalizar protocolo al llegar al último paso', () => {
      therapeuticProtocolService.startProtocol('user333', 'panic_protocol');
      // Avanzar hasta el último paso
      therapeuticProtocolService.advanceProtocol('user333'); // paso 2
      therapeuticProtocolService.advanceProtocol('user333'); // paso 3
      const final = therapeuticProtocolService.advanceProtocol('user333'); // paso 4 (último)
      
      expect(final).toBeDefined();
      expect(final).toHaveProperty('step');
      expect(final.step).toBe(4);
      
      // Verificar que el protocolo activo tiene el paso actualizado
      const active = therapeuticProtocolService.getActiveProtocol('user333');
      expect(active.currentStep).toBe(4);
      
      // Intentar avanzar más debería retornar null (protocolo terminado)
      const beyond = therapeuticProtocolService.advanceProtocol('user333');
      expect(beyond).toBeNull();
      
      // El protocolo debería haberse eliminado
      const deleted = therapeuticProtocolService.getActiveProtocol('user333');
      expect(deleted).toBeNull();
    });

    it('debe iniciar protocolo de culpa', () => {
      const protocol = therapeuticProtocolService.startProtocol('user444', 'guilt_protocol');
      
      expect(protocol).toBeDefined();
      expect(protocol.protocolName).toBe('guilt_protocol');
      expect(protocol.currentStep).toBe(1);
    });

    it('debe iniciar protocolo de soledad', () => {
      const protocol = therapeuticProtocolService.startProtocol('user555', 'loneliness_protocol');
      
      expect(protocol).toBeDefined();
      expect(protocol.protocolName).toBe('loneliness_protocol');
    });
  });
});

