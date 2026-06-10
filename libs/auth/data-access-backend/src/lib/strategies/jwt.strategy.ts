import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly userService: UserService) {
        super({
            // 1. Tự động bóc tách chuỗi Bearer Token từ Authorization Header do Angular Interceptor gửi lên
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // 2. Khóa bí mật để giải mã Token (Phải trùng với khóa lúc ông tạo token khi Login)
            secretOrKey: process.env['JWT_SECRET'] || 'secretKey',
        });
    }

    /**
     * Hàm này sẽ TỰ ĐỘNG được kích hoạt sau khi Passport giải mã thành công chữ ký Token.
     * @param payload Vật thể chứa thông tin User thu gọn đã được mã hóa trong token (ví dụ: { uid, email })
     */
    async validate(payload: any) {
        console.log('=== PASSPORT JWT DECODED SUCCESS ===');
        console.log('Payload nhận được từ Token:', payload);
        // Truy vấn xuống DB để kiểm tra xem User này có còn tồn tại/hợp pháp hay không
        const user = await this.userService.findByUid(payload.uid);

        if (!user) {
            throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc tài khoản không tồn tại.');
        }

        // Dữ liệu return ở đây sẽ được NestJS tự động gán vào vật thể `req.user` ở các Controller
        return user;
    }
}