const fp = require('fastify-plugin');

module.exports = fp(async (fastify, options) => {
  // 用于系统初始化时，设置第一个用户，只能使用一次，其他用户由该用户创建
  fastify.post(`${options.prefix}/initSuperAdmin`, {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    await fastify.accountServices.admin.initSuperAdmin(await fastify.accountServices.user.getUserInfo(request.authenticatePayload));
    return {};
  });

  fastify.get(`${options.prefix}/admin/getSuperAdminInfo`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin]
  }, async (request) => {
    return { userInfo: request.userInfo };
  });

  fastify.post(`${options.prefix}/admin/addUser`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {}
    }
  }, async (request) => {
    const userInfo = request.body;
    await fastify.accountServices.admin.addUser(Object.assign({}, userInfo, { password: options.defaultPassword }));
    return {};
  });

  fastify.get(`${options.prefix}/admin/getAllUserList`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      query: {}
    }
  }, async (request) => {
    const { filter, perPage, currentPage } = Object.assign({
      perPage: 20, currentPage: 1
    }, request.query);
    return await fastify.accountServices.admin.getAllUserList({
      filter, perPage, currentPage
    });
  });

  fastify.get(`${options.prefix}/admin/getAllTenantList`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      query: {
        type: 'object', properties: {
          name: {
            type: 'string'
          }, serviceStartTime: {
            type: 'string', format: 'date-time'
          }, serviceEndTime: {
            type: 'string', format: 'date-time'
          }, perPage: {
            type: 'number'
          }, currentPage: {
            type: 'number'
          }
        }
      }
    }
  }, async (request) => {
    const { name, perPage, currentPage } = Object.assign({
      perPage: 20, currentPage: 1
    }, request.query);
    return await fastify.accountServices.admin.getAllTenantList({
      filter: { name }, perPage, currentPage
    });
  });

  fastify.get(`${options.prefix}/admin/getTenantInfo`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      query: {
        type: 'object', properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.query;
    return await fastify.accountServices.tenant.getTenantInfo({ id });
  });

  fastify.post(`${options.prefix}/admin/addTenant`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['name', 'accountNumber', 'serviceStartTime', 'serviceEndTime'], properties: {
          name: { type: 'string' }, accountNumber: { type: 'number' }, serviceStartTime: {
            type: 'string', format: 'date-time'
          }, serviceEndTime: {
            type: 'string', format: 'date-time'
          }
        }
      }
    }
  }, async (request) => {
    await fastify.accountServices.admin.addTenant(request.body);
    return {};
  });

  fastify.post(`${options.prefix}/admin/saveTenant`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['id', 'name', 'accountNumber', 'serviceStartTime', 'serviceEndTime'], properties: {
          id: { type: 'string' }, name: { type: 'string' }, accountNumber: { type: 'number' }, serviceStartTime: {
            type: 'string', format: 'date-time'
          }, serviceEndTime: {
            type: 'string', format: 'date-time'
          }
        }
      }
    }
  }, async (request) => {
    await fastify.accountServices.admin.saveTenant(request.body);
    return {};
  });

  fastify.post(`${options.prefix}/admin/resetUserPassword`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['userId', 'password'], properties: {
          password: { type: 'string' }, userId: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    await fastify.accountServices.admin.resetUserPassword(request.body);
    return {};
  });

  fastify.post(`${options.prefix}/admin/saveUser`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['id'], properties: {
          id: { type: 'string' },
          avatar: { type: 'string' },
          nickname: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const user = request.body;
    await fastify.accountServices.user.saveUser(user);
    return {};
  });

  fastify.get(`${options.prefix}/admin/getRoleList`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      query: {
        type: 'object', required: ['tenantId'], properties: {
          tenantId: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { tenantId, perPage, currentPage } = Object.assign({
      perPage: 20, currentPage: 1
    }, request.query);
    return await fastify.accountServices.tenant.getRoleList({ tenantId, perPage, currentPage });
  });

  fastify.post(`${options.prefix}/admin/addRole`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['tenantId', 'name'], properties: {
          tenantId: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { tenantId, name, description } = request.body;
    await fastify.accountServices.tenant.addRole({ tenantId, name, description });

    return {};
  });

  fastify.post(`${options.prefix}/admin/saveRole`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['name', 'id'], properties: {
          id: { type: 'number' }, name: { type: 'string' }, description: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    await fastify.accountServices.tenant.saveRole(request.body);
    return {};
  });

  fastify.post(`${options.prefix}/admin/removeRole`, {
    onRequest: [fastify.authenticate, fastify.authenticateAdmin], schema: {
      body: {
        type: 'object', required: ['id'], properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.body;
    await fastify.accountServices.tenant.removeRole({ id });
    return {};
  });
});
