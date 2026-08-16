package com.chulsooya.server.domain.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventCampaignRepository extends JpaRepository<EventCampaign, Long> {
    List<EventCampaign> findAllByOrderByHeroSortAscIdAsc();
    List<EventCampaign> findByActiveTrueAndHeroEnabledTrueOrderByHeroSortAscIdAsc();
}
