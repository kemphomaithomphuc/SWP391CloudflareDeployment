package swp391.code.swp391.service;

import swp391.code.swp391.dto.PriceFactorDTO;
import swp391.code.swp391.entity.PriceFactor;

import java.util.List;

public interface PriceFactorService {

    List<PriceFactorDTO> getPriceFactorsByStation(Long stationId);

    PriceFactorDTO createPriceFactor(PriceFactorDTO priceFactorDTO);

    PriceFactorDTO updatePriceFactor(Long id, PriceFactorDTO priceFactorDTO);

    void deletePriceFactor(Long id);
}
