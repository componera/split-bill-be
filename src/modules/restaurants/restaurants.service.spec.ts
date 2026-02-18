import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';

describe('RestaurantsService', () => {
	let service: RestaurantsService;
	let restaurantRepo: any;

	const mockRestaurant = {
		id: 'rest-1',
		name: 'Test Restaurant',
		email: 'test@restaurant.com',
		location: 'Cape Town',
		ownerName: 'John',
	};

	const mockQueryBuilder = {
		innerJoin: mock(function (this: any) {
			return this;
		}),
		getMany: mock(() => Promise.resolve([])),
	};

	beforeEach(async () => {
		restaurantRepo = {
			findOne: mock(() => Promise.resolve(null)),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'rest-1', ...entity })),
			createQueryBuilder: mock(() => mockQueryBuilder),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [RestaurantsService, { provide: getRepositoryToken(Restaurant), useValue: restaurantRepo }],
		}).compile();

		service = module.get<RestaurantsService>(RestaurantsService);
	});

	describe('create', () => {
		it('should create and return a new restaurant', async () => {
			const dto = { name: 'New Place', email: 'new@place.com', location: 'Joburg', ownerName: 'Jane' };

			const result = await service.create(dto);

			expect(restaurantRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Place', email: 'new@place.com' }));
			expect(restaurantRepo.save).toHaveBeenCalled();
			expect(result).toHaveProperty('id');
		});
	});

	describe('findById', () => {
		it('should return a restaurant by id', async () => {
			restaurantRepo.findOne.mockResolvedValue(mockRestaurant);

			const result = await service.findById('rest-1');

			expect(result).toEqual(mockRestaurant);
		});

		it('should throw NotFoundException if restaurant not found', async () => {
			restaurantRepo.findOne.mockResolvedValue(null);

			expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('connectLightspeed', () => {
		it('should save the lightspeed account id', async () => {
			restaurantRepo.findOne.mockResolvedValue({ ...mockRestaurant });

			const result = await service.connectLightspeed('rest-1', {
				accountId: 'ls-acc-1',
				accessToken: 'tok',
				refreshToken: 'ref',
			});

			expect(restaurantRepo.save).toHaveBeenCalledWith(expect.objectContaining({ lightspeedAccountId: 'ls-acc-1' }));
		});
	});

	describe('connectYoco', () => {
		it('should save the yoco secret key', async () => {
			restaurantRepo.findOne.mockResolvedValue({ ...mockRestaurant });

			const result = await service.connectYoco('rest-1', { secretKey: 'sk_test_123', publicKey: 'pk_test_123' });

			expect(restaurantRepo.save).toHaveBeenCalledWith(expect.objectContaining({ yocoSecretKey: 'sk_test_123' }));
		});
	});

	describe('findAllConnectedLightspeed', () => {
		it('should query restaurants with lightspeed tokens', async () => {
			mockQueryBuilder.getMany.mockResolvedValue([mockRestaurant]);

			const result = await service.findAllConnectedLightspeed();

			expect(restaurantRepo.createQueryBuilder).toHaveBeenCalledWith('restaurant');
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('restaurant.lightspeedTokens', 'token');
			expect(result).toHaveLength(1);
		});
	});
});
