<template>
  <div class="movie-card" @click="$emit('click')">
    <div class="poster">
      <img :src="movie.video_img_url" :alt="movie.video_title" loading="lazy" />
      <div class="play-overlay">
        <span class="play-icon">▶</span>
      </div>
    </div>
    <div class="info">
      <h3 class="title">{{ movie.video_title }}</h3>
      <p class="meta">
        <span class="type">{{ movie.type_name }}</span>
        <span class="views">{{ movie.play_times_formatted }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  movie: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])
</script>

<style lang="scss" scoped>
.movie-card {
  cursor: pointer;
  transition: transform 0.3s;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    
    .play-overlay {
      opacity: 1;
    }
  }
  
  .poster {
    position: relative;
    padding-bottom: 140%;
    overflow: hidden;
    background: #f5f5f5;
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      
      .play-icon {
        font-size: 40px;
        color: #fff;
      }
    }
  }
  
  .info {
    padding: 10px;
    
    .title {
      font-size: 14px;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .meta {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      font-size: 12px;
      color: #999;
      
      .type {
        color: #409eff;
      }
    }
  }
}
</style>