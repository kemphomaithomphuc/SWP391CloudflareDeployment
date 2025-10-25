package swp391.code.swp391.service;

import swp391.code.swp391.entity.PriceFactor;

import java.util.List;

public interface PriceFactorService {

    List<PriceFactor> getPriceFactorsByStation(Long stationId);

    PriceFactor createPriceFactor(PriceFactor priceFactor);

    PriceFactor updatePriceFactor(Long id, PriceFactor priceFactor);

    void deletePriceFactor(Long id);
}
