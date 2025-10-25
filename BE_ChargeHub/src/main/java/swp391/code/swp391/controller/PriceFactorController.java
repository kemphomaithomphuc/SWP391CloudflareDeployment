package swp391.code.swp391.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.entity.PriceFactor;
import swp391.code.swp391.service.PriceFactorService;

import java.util.List;

@RestController
@RequestMapping("/api/price-factors")
@RequiredArgsConstructor
public class PriceFactorController {

    private final PriceFactorService priceFactorService;

    @GetMapping("/station/{stationId}")
    public ResponseEntity<List<PriceFactor>> getPriceFactorsByStation(@PathVariable Long stationId) {
        List<PriceFactor> factors = priceFactorService.getPriceFactorsByStation(stationId);
        return ResponseEntity.ok(factors);
    }

    @PostMapping
    public ResponseEntity<PriceFactor> createPriceFactor(@RequestBody PriceFactor priceFactor) {
        PriceFactor created = priceFactorService.createPriceFactor(priceFactor);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PriceFactor> updatePriceFactor(@PathVariable Long id, @RequestBody PriceFactor priceFactor) {
        PriceFactor updated = priceFactorService.updatePriceFactor(id, priceFactor);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePriceFactor(@PathVariable Long id) {
        priceFactorService.deletePriceFactor(id);
        return ResponseEntity.noContent().build();
    }
}
