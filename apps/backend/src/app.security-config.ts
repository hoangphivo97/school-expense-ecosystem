import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'short', 
    ttl: 1000,       
    limit: 3,        
  },
  {
    name: 'medium', 
    ttl: 60000,     
    limit: 30,      
  }
];