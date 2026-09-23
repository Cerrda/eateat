import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('kitchen flow', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('binds a pair, publishes a dish, and finishes a meal', async () => {
    const server = app.getHttpServer();
    const stamp = Date.now().toString(36);

    const cookerToken = await openSession(server, `cooker${stamp}key0001`);
    const eaterToken = await openSession(server, `eater${stamp}key00001`);

    const created = await request(server)
      .post('/api/v1/kitchens')
      .set(auth(cookerToken))
      .send({ role: 'COOKER' });
    expect(created.status).toBe(201);
    const code = created.body.membership.invite.code as string;

    const joined = await request(server)
      .post(`/api/v1/invites/${code}/join`)
      .set(auth(eaterToken))
      .send({ abandon: false });
    expect(joined.status).toBe(201);
    expect(joined.body.membership.role).toBe('EATER');

    const unsupported = await request(server)
      .post('/api/v1/dishes/import')
      .set(auth(cookerToken))
      .send({ url: 'https://example.com/recipe' });
    expect(unsupported.status).toBe(400);
    expect(unsupported.body.code).toBe('LINK_UNSUPPORTED');

    const draft = await request(server)
      .post('/api/v1/dishes')
      .set(auth(cookerToken))
      .send({ name: '番茄炒蛋' });
    expect(draft.status).toBe(201);

    const hidden = await request(server).get('/api/v1/menu').set(auth(eaterToken));
    expect(hidden.body.dishes).toEqual([]);

    const blockedPublish = await request(server)
      .post(`/api/v1/dishes/${draft.body.id}/publish`)
      .set(auth(cookerToken))
      .send({});
    expect(blockedPublish.status).toBe(400);

    const cover = await request(server)
      .post(`/api/v1/dishes/${draft.body.id}/covers`)
      .set(auth(cookerToken))
      .send({});
    expect(cover.status).toBe(201);
    expect(cover.body.status).toBe('READY');

    const adopted = await request(server)
      .post(`/api/v1/dishes/${draft.body.id}/covers/${cover.body.id}/adopt`)
      .set(auth(cookerToken))
      .send({});
    expect(adopted.body.coverPath).toContain('/api/v1/media/');

    const ready = await request(server)
      .patch(`/api/v1/dishes/${draft.body.id}`)
      .set(auth(cookerToken))
      .send({ name: '番茄炒蛋', summary: '家里常做', sourceUrl: draft.body.sourceUrl });
    expect(ready.status).toBe(200);

    const published = await request(server)
      .post(`/api/v1/dishes/${draft.body.id}/publish`)
      .set(auth(cookerToken))
      .send({});
    expect(published.status).toBe(201);
    expect(published.body.status).toBe('PUBLISHED');

    const menu = await request(server).get('/api/v1/menu').set(auth(eaterToken));
    expect(menu.body.dishes).toHaveLength(1);
    expect(menu.body.dishes[0].sourceUrl).toBeUndefined();

    const mealDate = shanghaiDate();
    const ordered = await request(server).post('/api/v1/orders').set(auth(eaterToken)).send({
      mealDate,
      slot: 'DINNER',
      dishIds: [draft.body.id],
      note: '少放糖',
    });
    expect(ordered.status).toBe(201);
    expect(ordered.body.status).toBe('PENDING');
    expect(ordered.body.items[0].name).toBe('番茄炒蛋');

    const duplicate = await request(server).post('/api/v1/orders').set(auth(eaterToken)).send({
      mealDate,
      slot: 'DINNER',
      dishIds: [draft.body.id],
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('SLOT_TAKEN');

    const inUse = await request(server)
      .delete(`/api/v1/dishes/${draft.body.id}`)
      .set(auth(cookerToken));
    expect(inUse.status).toBe(409);

    const rejected = await request(server)
      .post(`/api/v1/orders/${ordered.body.id}/reject`)
      .set(auth(cookerToken))
      .send({ message: '今天来不及' });
    expect(rejected.status).toBe(201);
    expect(rejected.body.message).toBe('今天来不及');

    const again = await request(server).post('/api/v1/orders').set(auth(eaterToken)).send({
      mealDate,
      slot: 'DINNER',
      dishIds: [draft.body.id],
    });
    expect(again.status).toBe(201);

    await request(server)
      .post(`/api/v1/orders/${again.body.id}/accept`)
      .set(auth(cookerToken))
      .send({})
      .expect(201);
    const done = await request(server)
      .post(`/api/v1/orders/${again.body.id}/complete`)
      .set(auth(cookerToken))
      .send({});
    expect(done.body.status).toBe('COMPLETED');

    const recorded = await request(server)
      .post('/api/v1/records')
      .set(auth(cookerToken))
      .send({
        mealDate,
        slot: 'DINNER',
        body: '今晚这盘很好吃',
        orderId: again.body.id,
        dishIds: [draft.body.id],
        photos: [{ dataBase64: PNG, mime: 'image/png' }],
      });
    expect(recorded.status).toBe(201);

    const shared = await request(server).get('/api/v1/records').set(auth(eaterToken));
    expect(shared.body.records[0].body).toBe('今晚这盘很好吃');

    const renamed = await request(server)
      .patch('/api/v1/me/name')
      .set(auth(cookerToken))
      .send({ displayName: '阿林' });
    expect(renamed.body.membership.displayName).toBe('阿林');

    await request(server).post('/api/v1/kitchens/unbind').set(auth(eaterToken)).send({}).expect(201);
    const after = await request(server).get('/api/v1/me').set(auth(cookerToken));
    expect(after.body.membership).toBeNull();
    await request(server).get('/api/v1/menu').set(auth(eaterToken)).expect(403);
  });
});

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function openSession(server: App, clientKey: string) {
  const response = await request(server)
    .post('/api/v1/auth/session')
    .send({ clientKey });
  expect(response.status).toBe(201);
  return response.body.token as string;
}

function shanghaiDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
