const fp = require('fastify-plugin');
const dayjs = require('dayjs');
const bcrypt = require('bcryptjs');

function generateRandom6DigitNumber() {
  const randomNumber = Math.random() * 1000000;
  return Math.floor(randomNumber).toString().padStart(6, '0');
}

module.exports = fp(async (fastify, options) => {
  const login = () => {
  };
  const register = async ({
                            avatar,
                            nickname,
                            gender,
                            birthday,
                            description,
                            phone,
                            phoneCode,
                            email,
                            code,
                            password,
                            invitationCode
                          }) => {
    const type = phone ? 0 : 1;
    const verificationCode = await fastify.models.VerificationCode.findOne({
      where: {
        name: type === 0 ? `${phoneCode} ${phone}` : email, type, code, status: 1
      }
    });
    if (!verificationCode) {
      throw new Error('验证码不正确或者已经过期');
    }

    verificationCode.status = 2;
    await verificationCode.save();

    if (await fastify.models.User.count({
      where: type === 0 ? {
        phone, phoneCode
      } : {
        email
      }
    }) > 0) {
      throw new Error('用户已经存在不能重复注册');
    }

    const salt = await bcrypt.genSalt(10);
    const combinedString = password + salt;
    const hash = await bcrypt.hash(combinedString, salt);


    const account = await fastify.models.UserAccount.create({ password: hash, salt });
    const user = await fastify.models.User.create({
      avatar, nickname, gender, birthday, description, phone, phoneCode, email, userAccountId: account.id
    });

    return user;
  };

  const sendEmailCode = async ({ email }) => {
    const code = generateRandom6DigitNumber();

    // 这里写发送逻辑

    await fastify.models.VerificationCode.update({
      status: 2
    }, {
      where: {
        name: email, type: 1, status: 0
      }
    });

    await fastify.models.VerificationCode.create({
      name: email, type: 1, code
    });

    return code;
  };

  const verificationCodeValidate = async ({ name, type, code }) => {
    const verificationCode = await fastify.models.VerificationCode.findOne({
      where: {
        name, type, code, status: 0
      }
    });
    const isPass = !!(verificationCode && dayjs().isBefore(dayjs(verificationCode.createdAt).add(10, 'minute')));

    if (verificationCode) {
      verificationCode.status = isPass ? 1 : 2;
      await verificationCode.save();
    }

    return isPass;
  };

  const sendSMSCode = async ({ phone, phoneCode }) => {
    const code = generateRandom6DigitNumber();

    // 这里写发送逻辑

    await fastify.models.VerificationCode.update({
      status: 2
    }, {
      where: {
        name: `${phoneCode} ${phone}`, type: 0, status: 0
      }
    });

    await fastify.models.VerificationCode.create({
      name: `${phoneCode} ${phone}`, type: 0, code
    });

    return code;
  };


  fastify.decorate('AccountService', {
    login, register, sendEmailCode, sendSMSCode, verificationCodeValidate
  });
});
