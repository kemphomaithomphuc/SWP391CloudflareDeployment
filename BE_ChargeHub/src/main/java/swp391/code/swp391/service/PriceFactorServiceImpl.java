package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import swp391.code.swp391.entity.ChargingStation;
import swp391.code.swp391.entity.PriceFactor;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.repository.ChargingStationRepository;
import swp391.code.swp391.repository.PriceFactorRepository;
import swp391.code.swp391.repository.SessionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceFactorServiceImpl implements PriceFactorService {

    private final PriceFactorRepository priceFactorRepository;
    private final SessionRepository sessionRepository;
    private final ChargingStationRepository chargingStationRepository;

    @Override
    public List<PriceFactor> getPriceFactorsByStation(Long stationId) {
        return priceFactorRepository.findByStationStationId(stationId);
    }

    @Override
    public PriceFactor createPriceFactor(PriceFactor priceFactor) {
        // Validate station exists
        ChargingStation station = chargingStationRepository.findById(priceFactor.getStation().getStationId())
                .orElseThrow(() -> new IllegalArgumentException("Station not found"));

        // Check for overlapping time
        List<PriceFactor> existingFactors = priceFactorRepository.findByStationStationId(station.getStationId());
        for (PriceFactor pf : existingFactors) {
            if (isOverlapping(pf.getStartTime(), pf.getEndTime(), priceFactor.getStartTime(), priceFactor.getEndTime())) {
                throw new IllegalArgumentException("Time overlap with existing PriceFactor");
            }
        }

        priceFactor.setStation(station);
        return priceFactorRepository.save(priceFactor);
    }

    @Override
    public PriceFactor updatePriceFactor(Long id, PriceFactor priceFactor) {
        PriceFactor existing = priceFactorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PriceFactor not found"));

        // Check for overlapping time, excluding itself
        List<PriceFactor> existingFactors = priceFactorRepository.findByStationStationId(existing.getStation().getStationId());
        for (PriceFactor pf : existingFactors) {
            if (!pf.getPriceFactorId().equals(id) &&
                isOverlapping(pf.getStartTime(), pf.getEndTime(), priceFactor.getStartTime(), priceFactor.getEndTime())) {
                throw new IllegalArgumentException("Time overlap with existing PriceFactor");
            }
        }

        existing.setFactor(priceFactor.getFactor());
        existing.setStartTime(priceFactor.getStartTime());
        existing.setEndTime(priceFactor.getEndTime());
        existing.setDescription(priceFactor.getDescription());

        return priceFactorRepository.save(existing);
    }

    @Override
    public void deletePriceFactor(Long id) {
        PriceFactor priceFactor = priceFactorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PriceFactor not found"));

        // Check if applied ( if any session within the time range exists)
        List<Session> sessions = sessionRepository.findByOrderChargingPointStationStationId(priceFactor.getStation().getStationId());
        for (Session session : sessions) {
            if (session.getStartTime().isBefore(priceFactor.getEndTime()) &&
                (session.getEndTime() == null || session.getEndTime().isAfter(priceFactor.getStartTime()))) {
                throw new IllegalArgumentException("Cannot delete PriceFactor that has been applied to sessions");
            }
        }

        priceFactorRepository.delete(priceFactor);
    }

    private boolean isOverlapping(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}
