package swp391.code.swp391.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.PriceFactorDTO;
import swp391.code.swp391.service.PriceFactorService;

import java.util.List;

@RestController
@RequestMapping("/api/price-factors")
@RequiredArgsConstructor
public class PriceFactorController {

    private final PriceFactorService priceFactorService;

    @GetMapping("/station/{stationId}")
    public ResponseEntity<List<PriceFactorDTO>> getPriceFactorsByStation(@PathVariable Long stationId) {
        List<PriceFactorDTO> factors = priceFactorService.getPriceFactorsByStation(stationId);
        return ResponseEntity.ok(factors);
    }

    @PostMapping
    public ResponseEntity<PriceFactorDTO> createPriceFactor(@RequestBody PriceFactorDTO priceFactorDTO) {
        PriceFactorDTO created = priceFactorService.createPriceFactor(priceFactorDTO);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PriceFactorDTO> updatePriceFactor(@PathVariable Long id, @RequestBody PriceFactorDTO priceFactorDTO) {
        PriceFactorDTO updated = priceFactorService.updatePriceFactor(id, priceFactorDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePriceFactor(@PathVariable Long id) {
        priceFactorService.deletePriceFactor(id);
        return ResponseEntity.noContent().build();
    }
}
