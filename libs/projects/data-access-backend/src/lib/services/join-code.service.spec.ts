import { BadRequestException } from '@nestjs/common';
import { JoinCodeService } from './join-code.service';


describe('JoinCodeService', () => {
  let service: JoinCodeService;

  beforeEach(() => {
    service = new JoinCodeService();
  });

  describe('generateCode', () => {
    it('should generate a code with specified length without ambiguous characters (0, O, 1, I)', () => {
      const code = service.generateCode(8);
      expect(code).toHaveLength(8);
      expect(code).not.toMatch(/[0O1I]/);
    });
  });

  describe('validateJoinCodeSchedule', () => {
    const entityEnd = new Date(Date.now() + 86400000 * 10).toISOString();

    it('should throw BadRequestException if startsAt is after expiresAt', () => {
      const startsAt = new Date(Date.now() + 86400000 * 2).toISOString();
      const expiresAt = new Date(Date.now() + 86400000 * 1).toISOString();

      expect(() =>
        service.validateJoinCodeSchedule({ startsAt, expiresAt }, entityEnd)
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if expiresAt exceeds entityEndDate', () => {
      const startsAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 86400000 * 15).toISOString();

      expect(() =>
        service.validateJoinCodeSchedule({ startsAt, expiresAt }, entityEnd)
      ).toThrow(BadRequestException);
    });

    it('should pass validation when timeframe is valid', () => {
      const startsAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 86400000 * 5).toISOString();

      expect(() =>
        service.validateJoinCodeSchedule({ startsAt, expiresAt }, entityEnd)
      ).not.toThrow();
    });
  });
});